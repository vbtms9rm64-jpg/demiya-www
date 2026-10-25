/**
 * Page copy, verbatim from the Elementor content in the clean backup.
 * Changing wording here changes the site — this is the source of truth.
 */

import omurice from "../assets/Demiya_Omurice-scaled.jpg";
import doria from "../assets/Demiya_ButaDoria-scaled.jpg";
import tonkatsu from "../assets/Demiya_TonkKatsuCurryRice-scaled.jpg";
import katsuUdon from "../assets/Demiya_T-onKatsuCurryUdon-scaled.jpg";
import mentaiko from "../assets/Demiya_MentaikoCreamVdon-scaled.jpg";
import tegone from "../assets/Tegone.teishoku.wood_.png";

import crab from "../assets/Demiya_SoftShellCrab-scaled.jpg";
import menchi from "../assets/Demiya_Menchi-scaled.jpg";
import karaage from "../assets/Demiya_KaraageKatsu-scaled.jpg";
import gallery5 from "../assets/Gallery5.png";
import gallery3 from "../assets/Gallery3.png";
import gallery6 from "../assets/Gallery-6.png";

export const hero = {
  eyebrow: "Japanese Comfort Food · Bay Area",
  heading: "Sharing Japanese Comfort Food Since 2016",
  body:
    "From Japanese curry and crispy katsu to omurice and curry doria, we proudly serve the Yoshoku comforting flavors of Japan throughout the Bay Area.",
};

export const story = {
  eyebrow: "Our Story",
  heading: "From Kyoto to the Bay Area.",
  paragraphs: [
    "Demiya was founded by Demi Ebara from Kyoto, Japan, a mother of four, with the goal of bringing Japanese comfort food to the Bay Area.",
    "Inspired by Japanese Yoshoku culture — a uniquely Japanese style of Western-influenced cuisine that began during the Meiji era — Demiya focuses on rich curry sauces, crispy katsu, and a variety of carefully prepared dishes made with consistency and care.",
    "Since opening the first location in 2016, Demiya has continued to grow while staying rooted in quality, flavor, and everyday comfort food that people can enjoy regularly.",
    "Today, Demiya proudly serves communities across the Bay Area and continues to evolve while honoring its original spirit.",
  ],
};

export const serve = {
  eyebrow: "What We Serve",
  heading: "Comfort food done right.",
  body:
    "Every dish is made fresh, every day. Rooted in Yoshoku tradition — Japanese soul, Western comfort.",
  // Descriptions appear on hover — see DishCard.astro.
  dishes: [
    {
      name: "Omurice",
      image: omurice,
      description:
        "Fluffy egg omelette over savory tomato fried rice — a Japanese comfort classic.",
    },
    {
      name: "Curry Doria",
      image: doria,
      description:
        "Japanese baked curry rice gratin, finished with melted cheese. Rich, creamy, irresistible.",
    },
    {
      name: "Tonkatsu Curry",
      image: tonkatsu,
      // FIXME: this is the Tonkatsu Curry *Udon* description, copy-pasted onto
      // the rice dish in the original site. Carried over verbatim rather than
      // invented — needs real copy from the restaurant.
      description:
        "Udon noodles in a warm curry broth, served with crispy Tonkatsu on top.",
    },
    {
      name: "Tonkatsu Curry Udon",
      image: katsuUdon,
      // The original read "don noodles" — a dropped leading U. Fixed here.
      description:
        "Udon noodles in a warm curry broth, served with crispy Tonkatsu on top.",
    },
    {
      name: "Mentaiko Cream Udon",
      image: mentaiko,
      description:
        "Udon noodles in a creamy, lightly spicy cod roe sauce — bold and satisfying.",
    },
    {
      name: "Tegone Cheese Hamburg Bento",
      image: tegone,
      description:
        "Japanese handmade hamburger steak stuffed with cheese, with house-made brown sauce — served with rice, miso soup, and sides.",
    },
  ],
};

export const gallery = {
  eyebrow: "Gallery",
  heading: "The food speaks for itself.",
  body:
    "Fresh ingredients, bold flavors, and dishes made with care — every day, at every location.",
  images: [
    { src: crab, alt: "Soft shell crab curry" },
    { src: menchi, alt: "Menchi katsu plate" },
    { src: karaage, alt: "Karaage and katsu plate" },
    { src: gallery5, alt: "Demiya dish" },
    { src: gallery3, alt: "Demiya dish" },
    { src: gallery6, alt: "Demiya dish" },
  ],
};

export const reviews = {
  eyebrow: "What people are saying",
  heading: "Real reviews, real comfort.",
  body: "Verified Google Reviews",
};

export const findUs = {
  eyebrow: "Find Us",
  heading: "5 locations across the Bay Area.",
  body: "Order online from your nearest Demiya — pickup ready.",
};

export const instagramCta =
  "Follow us on Instagram @demiya_inc for daily updates from all locations.";
