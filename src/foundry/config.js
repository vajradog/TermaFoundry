/*
  Terma Foundry — new site configuration.
  Everything in src/foundry/, src/pages/test/ and public/test/ belongs to the new site.
  When this site moves to the root of the domain, change BASE to '' and move
  src/pages/test/* to src/pages/* and public/test/* to public/*.
*/
export const BASE = '/test';
export const SITE_NAME = 'Terma Foundry';
export const PUBLISHER = 'Terma Heritage Foundation';
export const BUILD = {
  version: '1.0',
  date: '2026-10-01',
  dateHuman: '1 October 2026',
  label: 'Review build v1.0',
};
export const paths = {
  home: `${BASE}/`,
  studio: `${BASE}/studio/`,
  directions: `${BASE}/directions/`,
  fonts: `${BASE}/fonts`,
};
