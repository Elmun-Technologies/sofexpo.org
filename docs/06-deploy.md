# 06 · Деплой: 6 hostname'ов из одного репозитория

Решение клиента (2026-09-18): **каждая регулярная выставка живёт на своём поддомене**,
номинации `foodera / buildpro / agropro / worldedu / ecomretail`, редакционные тексты
закреплены за хостом выставки (`event:` в frontmatter). Механика — в `docs/05-subdomains.md`,
здесь — только то, что делать на хостинге.

## 1. Рекомендуемая схема: Cloudflare Pages, по проекту на hostname

Почему именно так (а не «один проект + подпапки»): у нас на каждый hostname **свой набор
страниц** (у FOODERA 14 файлов, у центра 142) — один проект отдаёт один output, значит проектов
нужно 6. Это бесплатно, даёт CDN, мгновенный rollback и превью на каждый PR, и не требует
обслуживать сервер.

| Поле проекта           | Значение                                                      |
| ---------------------- | ------------------------------------------------------------- |
| Project name           | `sofexpo` / `sofexpo-foodera` / `sofexpo-buildpro` / …        |
| Production branch      | `main`                                                        |
| Build command          | `node scripts/build-one-host.mjs <hostname>`                  |
| Build output directory | `dist`                                                        |
| Environment variables  | `PUBLIC_HOSTS_MODE=subdomain` (SITE подставляет сам скрипт)   |
| Custom domains         | `sofexpo.org`, `foodera.sofexpo.org`, … (по одному на проект) |

Готовые значения для 5 поддоменов:

    node scripts/build-one-host.mjs foodera.sofexpo.org
    node scripts/build-one-host.mjs buildpro.sofexpo.org
    node scripts/build-one-host.mjs agropro.sofexpo.org
    node scripts/build-one-host.mjs worldedu.sofexpo.org
    node scripts/build-one-host.mjs ecomretail.sofexpo.org
    node scripts/build-one-host.mjs sofexpo.org

Центральный проект дополнительно кладёт `dist/_redirects` (40 правил 301 на поддомены) —
Pages их подхватывает автоматически, руками ничего не вклеивается.

## 2. Альтернатива: свой VPS (nginx или Caddy)

Если сервер уже под `sofexpo.uz` и хочется держать всё там — это даже проще: одна сборка
матрицы, шесть каталогов, ноль лимитов.

    npm run check:hosts          # собирает все 6 хостов в dist-hosts/<host>/ и прогоняет аудиты
    rsync -a --delete dist-hosts/sofexpo.org/            /srv/sites/centre/
    rsync -a --delete dist-hosts/foodera.sofexpo.org/    /srv/sites/foodera/
    # …по одному на хост

Caddy (автоматический TLS, wildcard не обязателен — сертификат на каждый sub.domain бесплатно):

    *.sofexpo.org {
        @foodera host foodera.sofexpo.org
        handle @foodera { root * /srv/sites/foodera; try_files {path}/ {path}/index.html; file_server }
        handle { root * /srv/sites/centre; try_files {path}/ {path}/index.html; file_server }
    }

nginx — по одному `server`-блоку на `server_name`, `root` на соответствующий каталог,
`location / { try_files $uri $uri/ /index.html; }`. Правила 301 для переехавших путей уже лежат в
`dist-hosts/sofexpo.org/_redirects` (`from to 301`), для nginx они конвертируются на месте:

    awk '{print "rewrite ^" $1 "$ " $2 " permanent;"}' dist-hosts/sofexpo.org/_redirects

## 3. DNS

| Тип     | Имя                                                        | Значение                                                            |
| ------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| CNAME   | `foodera`, `buildpro`, `agropro`, `worldedu`, `ecomretail` | на цель Pages (`sofexpo-foodera.pages.dev` и т.д.) или A-запись VPS |
| A/ALIAS | `sofexpo.org`, `www`                                       | как сейчас                                                          |
| AAAA    | —                                                          | только если хостинг отдаёт IPv6                                     |

TTL на время переключения — 300 с, потом поднять.

## 4. Порядок дня X

1. Собрать и проверить всё: `npm run check:hosts` (должно быть «✓ hosts agree» + 6 зелёных аудитов).
2. Залить/задеплоить **сначала поддомены**, потом центр: иначе первые часы центр будет ссылаться
   на несуществующие хосты.
3. Проверить по одному URL каждого хоста: `curl -sI https://foodera.sofexpo.org/ru/` → 200,
   `curl -s https://sofexpo.org/ru/events/foodera-expo/ | grep canonical` → canonical на
   `foodera.sofexpo.org`.
4. Проверить 301: `curl -sI https://sofexpo.org/ru/events/foodera-expo/exhibitors/` → 301 на
   `https://foodera.sofexpo.org/ru/exhibitors/`.
5. Search Console: domain-property `sofexpo.org` + по URL-prefix на каждый поддомен; отправить
   `https://{host}/sitemap-index.xml` (у каждого свой — генерируется сборкой).
6. robots каждого хоста уже корректен (`Sitemap:` и `Host:` подставлены по hostname'у).
7. GA4: добавить измерение `hostname`, проверить, что `?event={slug}` в форме доживает до
   `page_location`. Заявки с поддомена не должны склеиться с центром.
8. Только после этого — печать/баннеры с коротким адресом `foodera.sofexpo.org`.

## 5. Чего не делать

- Не переносить `/news/` и `/articles/` **целиком** на поддомены: индексы остаются у центра,
  переезжают только тексты с тегом `event:` (иначе через год у каждого поддомена свой пустой
  архив и ноль ссылочного веса).
- Не ставить `noindex` на главную хоста выставки — это единственная страница, которая должна
  ранжироваться по «{бренд} 2027».
- Не плодить `www.foodera.sofexpo.org`: не добавляем в DNS — дешевле, чем редирект.
- Не включать локаль `uz`, пока клиент не подтвердит, что тексты на узбекском будет читать
  редактор (см. `docs/02` §3): структура к этому готова, контент — нет.
- Не править `dist/` руками: всё, что должно измениться, меняется в `src/data/host-map.json`
  или в контенте, и пересобирается.

## 6. Откат

Один флаг: `PUBLIC_HOSTS_MODE=alias` → одна сборка, всё на `sofexpo.org`, поддомены отдаём 301
обратно (правила есть: `dist-hosts/redirects.vanity.md`). Данные и тексты при этом не меняются
вообще — архитектура хостов отделена от контента специально.
