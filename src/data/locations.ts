/**
 * Location data — static, extracted from the Elementor content in the
 * verified-clean backup at `ffiver/wordpress/backups/demiya.wpress`
 * (pages "Home" id=8, "Hours" id=27, "Locations & Order" id=30).
 *
 * Deliberately NOT read from the Soux Postgres `locations` table: those rows
 * are operational records for the POS, these are the public listings. They
 * drift on purpose — the POS knows dayparts and tax rates, this knows what
 * the sign on the door says.
 *
 * To update the website: edit this file and push.
 */

import saratogaImg from "../assets/7.jpg";
import cupertinoImg from "../assets/lo2.jpg";
import dublinImg from "../assets/lo3.jpg";
import fremontImg from "../assets/lo44.jpg";
import emeryvilleImg from "../assets/lo5.jpg";

import type { ImageMetadata } from "astro";

export type HoursRow = {
  /** Day or day range, exactly as published. */
  days: string;
  /** Service windows, or null when closed. */
  times: string | null;
};

export type Location = {
  slug: string;
  /** Short name, matching the original's icon-list label. */
  name: string;
  /** Full address line, as published — venue note included. */
  address: string;
  /** Toast online-ordering page for this location. */
  orderUrl: string;
  /** Google Maps link, carried over from the original "get directions" button. */
  directionsUrl: string;
  /** Query string the original's embedded map used. */
  mapQuery: string;
  /** Zoom level the original set per location. */
  mapZoom: number;
  image: ImageMetadata;
  hours: HoursRow[];
};

/** Saratoga and Cupertino share a schedule; Fremont and Emeryville share another. */
const HOURS_SPLIT: HoursRow[] = [
  { days: "Monday", times: null },
  { days: "Tues–Thurs", times: "11:30am–1:00pm; 5:30pm–8:00pm" },
  { days: "Fri", times: "11:30am–1:00pm; 5:30pm–8:30pm" },
  { days: "Sat", times: "11:30am–1:30pm; 5:30pm–8:30pm" },
  { days: "Sunday", times: "11:30am–1:30pm; 5:30pm–7:30pm" },
];

const HOURS_DUBLIN: HoursRow[] = [
  { days: "Monday", times: null },
  { days: "Tues–Fri", times: "11:30am–2:30pm; 5:00pm–8:00pm" },
  { days: "Sat", times: "11:30am–3:00pm; 5:00pm–8:00pm" },
  { days: "Sunday", times: "11:30am–3:00pm; 5:00pm–7:30pm" },
];

const HOURS_STRAIGHT: HoursRow[] = [
  { days: "Monday", times: null },
  { days: "Tues–Sat", times: "11:30am–8:00pm" },
  { days: "Sunday", times: "11:30am–7:30pm" },
];

export const locations: Location[] = [
  {
    slug: "saratoga",
    name: "Saratoga Ave",
    address: "375 Saratoga Ave G, San Jose, CA 95129",
    orderUrl:
      "https://order.toasttab.com/online/demiya-saratoga-ave-em-375-saratoga-ave-ste-g",
    directionsUrl: "https://maps.google.com/?cid=5436000304034491432",
    mapQuery:
      "Demiya Restaurant, 375 Saratoga Ave G, San Jose, CA 95129",
    mapZoom: 16,
    image: saratogaImg,
    hours: HOURS_SPLIT,
  },
  {
    slug: "cupertino",
    name: "Cupertino",
    address: "1145 S De Anza Blvd, San Jose, CA 95129",
    orderUrl:
      "https://order.toasttab.com/online/demiya-de-anza-em-1145-south-de-anza-boulevard",
    directionsUrl: "https://maps.google.com/?cid=3644716006264776337",
    mapQuery:
      "Demiya Restaurant, 1145 S De Anza Blvd, San Jose, CA 95129",
    mapZoom: 15,
    image: cupertinoImg,
    hours: HOURS_SPLIT,
  },
  {
    slug: "dublin",
    name: "Dublin",
    address: "7477 Village Pkwy, Dublin, CA 94568",
    orderUrl: "https://order.toasttab.com/online/demiya-dublin-em-7477-village-parkway",
    directionsUrl: "https://maps.google.com/?cid=3663114869861571261",
    mapQuery:
      "Demiya Restaurant, 7477 Village Pkwy, Dublin, CA 94568",
    mapZoom: 15,
    image: dublinImg,
    hours: HOURS_DUBLIN,
  },
  {
    slug: "fremont",
    name: "Fremont",
    address: "46551 Mission Blvd, Fremont, CA 94539 (inside 99 Ranch)",
    orderUrl:
      "https://order.toasttab.com/online/demiya-fremont-em-46551-mission-boulevard",
    directionsUrl: "https://maps.google.com/?cid=7933985523873279718",
    mapQuery:
      "Demiya Restaurant, 46551 Mission Blvd, Fremont, CA 94539 ",
    mapZoom: 15,
    image: fremontImg,
    hours: HOURS_STRAIGHT,
  },
  {
    slug: "emeryville",
    name: "Emeryville",
    address: "5959 Shellmound St, Emeryville, CA 94608 (The Public Market)",
    orderUrl:
      "https://order.toasttab.com/online/demiya-emeryville-5959-shellmound-street",
    directionsUrl: "https://maps.google.com/?cid=17348960268417475696",
    mapQuery:
      "Demiya Restaurant, 5959 Shellmound St, Emeryville, CA 94608 (The Public Market)",
    mapZoom: 15,
    image: emeryvilleImg,
    hours: HOURS_STRAIGHT,
  },
];
