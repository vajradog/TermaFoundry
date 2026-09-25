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
  version: '0.1',
  date: '2026-09-25',
  dateHuman: '25 September 2026',
  label: 'Review build v0.1',
};
export const paths = {
  home: `${BASE}/`,
  yangtso: `${BASE}/yangtso/`,
  pema: `${BASE}/pema/`,
  studio: `${BASE}/studio/`,
  directions: `${BASE}/directions/`,
  fonts: `${BASE}/fonts`,
};
