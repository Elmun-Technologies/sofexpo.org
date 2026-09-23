/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    /** Development-only locale passed before Astro resolves the source route. */
    sofexpoLocale?: 'zh' | 'tr';
  }
}
