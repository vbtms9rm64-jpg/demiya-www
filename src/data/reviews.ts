/**
 * Google reviews — static snapshot.
 *
 * Extracted from the Trustindex plugin's cached markup in the clean backup
 * (`<template id="trustindex-google-widget-html">` on the Home, Hours and
 * Locations & Order pages). The original loaded cdn.trustindex.io at runtime;
 * this ships the same content as static HTML instead, so the rebuilt site
 * keeps its no-third-party-script property.
 *
 * STALE: this snapshot is from Feb–May 2026. Refresh the text before launch.
 *
 * To make these self-updating, swap this file for a build-time fetch from the
 * Google Places API — the shape below matches what Places returns
 * (author_name → author, rating, time → date, text), so only this module
 * changes. Note Places returns at most 5 reviews, you cannot choose which,
 * and its policy caps caching at 30 days, so pair it with a monthly rebuild.
 *
 * Google's terms require these to be attributed to Google — see the
 * "Posted on Google" line in Reviews.astro. Keep it.
 */

export type Review = {
  author: string;
  /** 1–5 */
  rating: number;
  /** ISO yyyy-mm-dd */
  date: string;
  text: string;
};

export const reviews: Review[] = [
  {
    author: "Ethan",
    rating: 5,
    date: "2026-05-31",
    text: "The chicken karaage dish gave a good amount of chicken, and the sauce was fantastic. I wish they gave more rice, and thag fact would make this dish much better. I thought the curry flavor could also have been richer, but overall really good!",
  },
  {
    author: "I W",
    rating: 5,
    date: "2026-05-17",
    text: "The tonkatsu curry rice is so yummy. Tonkatsu is cooked to perfection. I like that you can choose the spicy level of the curry. I usually go with 1. Level 2 is pretty spicy.",
  },
  {
    author: "Kira DeA",
    rating: 5,
    date: "2026-04-16",
    text: "Yummy",
  },
  {
    author: "Amanda Kaye Signo",
    rating: 5,
    date: "2026-02-24",
    text: "I've been here a couple times with some friends, and the curry is always delicious. I've ordered the Mapo Nasu Curry Udon and the Buta-Shabu Curry Rice, and they've left me feeling satisfied.",
  },
];
