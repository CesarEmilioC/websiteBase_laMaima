/**
 * English UI dictionary. Mirrors `es.ts` key by key — the `Dictionary` type
 * makes the compiler enforce it.
 *
 * Tone: warm boutique-hotel English, not a literal rendering of the Spanish.
 * Local terms that have no real equivalent keep their Spanish name with a short
 * gloss the first time they appear (see the seeded database content).
 */
import type { Dictionary } from "./es";

export const en: Dictionary = {
  /* --- Language switch ----------------------------------------------------- */
  locale: {
    group: "Site language",
    switchTo: {
      es: "Switch to Spanish",
      en: "Switch to English",
    },
    short: {
      es: "ES",
      en: "EN",
    },
  },

  /* --- Navigation ---------------------------------------------------------- */
  nav: {
    home: "Home",
    accommodations: "Stays",
    experiences: "Experiences",
    contact: "Contact",
    book: "Book",
    bookOnline: "Book online",
    primary: "Primary",
    primaryMobile: "Primary (mobile)",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "La Maima — Home",
    skipToContent: "Skip to content",
    whereWeAre: "Where we are",
    breadcrumb: "Breadcrumb",
  },

  /* --- Shared pieces -------------------------------------------------------- */
  common: {
    from: "From",
    upTo: "Up to",
    seeDetails: "See details",
    perNight: "/ night",
    copPerNight: "COP / night",
    night: "night",
    nights: "nights",
    guest: "guest",
    guests: "guests",
    whatsapp: "Message us on WhatsApp",
    whatsappAsk: "Ask on WhatsApp",
    whatsappConsult: "Ask on WhatsApp",
    whatsappFloat: "Message us on WhatsApp",
    whatsappCheck: "Check availability",
    talkToUs: "Talk to us",
    viewAvailability: "See availability",
    updatingSection: "We are updating this section",
    updatingSectionHelp:
      "In the meantime, send us a WhatsApp message and we will tell you what is available.",
  },

  /* --- Home ---------------------------------------------------------------- */
  home: {
    accommodations: {
      eyebrow: "Where to sleep",
      title: "Six houses and cabins, each with its own",
      titleAccent: "piece of mountain",
      lead: "All of them stand alone, with a fitted kitchenette and a private bathroom. Pick the one that suits your group and price your stay on real dates.",
      empty:
        "We are updating our accommodation details. Send us a WhatsApp message and we will tell you what is available.",
      cta: "See all six and book",
    },
    about: {
      cta: "See stays and dates",
      galleryLabel: "Photographs of the nature reserve",
    },
    experiences: {
      eyebrow: "What to do",
      title: "The forest is",
      titleAccent: "part of the plan",
      lead: "Forest trails, cold mountain water, a fire pit at dusk and birds that came back after thirty years of restoration.",
      carouselLabel: "Experiences at La Maima",
      prev: "See previous experiences",
      next: "See more experiences",
      ctaBook: "Book your stay",
      ctaAll: "See all experiences",
    },
    contact: {
      eyebrow: "Getting here",
      title: "Twelve kilometres up the Dapa road,",
      titleAccent: "less than an hour from Cali",
      lead: "The climb is on paved road and the final stretch is signposted. If it is your first time, write to us and we will send you the exact location and a few tips for the drive.",
      addressLabel: "Address",
      openInMaps: "Open in Google Maps",
      phoneLabel: "Phone and WhatsApp",
      socialLabel: "Social media",
      mapTitle: "La Maima's location on Google Maps",
      noteStrong: "Choose your dates online.",
      noteBody:
        "Every house has its own calendar with real availability and a live quote for your stay. We confirm your request on WhatsApp the same day.",
    },
    instagram: {
      title: "Day to day at the reserve",
      lead: "Sunrises over the valley, the birds that came back to the forest, and the houses from the inside.",
      cta: "Follow us on Instagram",
    },
  },

  /* --- Accommodation listing ------------------------------------------------ */
  accommodations: {
    heroEyebrow: "Houses and cabins in Dapa",
    heroTitle: "Sleep inside",
    heroTitleAccent: "the reserve",
    heroDescription:
      "Six independent houses spread across the hillside. Each with its own entrance, its own terrace and its own view. All with a fitted kitchenette and a private bathroom.",
    sectionEyebrow: "Where to sleep",
    sectionTitle: "Six houses and cabins",
    sectionLead:
      "Every house has its own rate depending on how many of you are coming, and Monday to Thursday nights cost less. Open a house to see the full table and price your stay on real dates.",
    emptyHelp:
      "In the meantime, send us a WhatsApp message and we will tell you which houses are available.",
  },

  /* --- Accommodation detail -------------------------------------------------- */
  detail: {
    checkIn: "Check-in 3:00 p.m.",
    petFriendly: "Pet friendly",
    cancellationLink: "Cancellation and rescheduling policy",
    rateFrom: "Rate from",
    rateConditions: "Rate conditions",
    about: (name: string) => `About ${name}`,
    included: "What's included",
    book: "Book",
    askAbout: (name: string) => `Ask about ${name} on WhatsApp`,
    replyBy: (phone: string) => `We reply on WhatsApp at ${phone}`,
    bookingEyebrow: "Bookings",
    bookingTitle: (name: string) => `Choose your dates at ${name}`,
    bookingLead:
      "The calendar shows real availability, including bookings that come in through Airbnb and Booking.com. Build your stay and send us the request: we confirm dates and payment the same day.",
    others: "Other houses",
    othersCta: "See all six",
    specialPlans: "Special packages",
    specialPlansNote:
      "If you pick dates inside a package, the calendar applies its price automatically.",
    planPerNight: "per night",
    notFoundTitle: "Accommodation not found",
  },

  /* --- Gallery and lightbox --------------------------------------------------- */
  gallery: {
    label: (name: string) => `Photo gallery of ${name}`,
    openOne: (alt: string) => `View the photo full screen: ${alt}`,
    open: (position: number, total: number, alt: string) =>
      `View photo ${position} of ${total} full screen: ${alt}`,
    openAll: (total: number) => `View all ${total} photos full screen`,
    morePhotos: (count: number) =>
      `+${count} ${count === 1 ? "photo" : "photos"}`,
    close: "Close the gallery",
    previous: "Previous photo",
    next: "Next photo",
    counter: (index: number, total: number) => `Photo ${index} of ${total}`,
    fallbackAlt: (name: string) => `${name} at La Maima`,
    dot: (position: number, total: number) => `View photo ${position} of ${total}`,
    carouselRole: "carousel",
  },

  /* --- Booking engine --------------------------------------------------------- */
  booking: {
    loading: "Loading availability…",
    errorTitle: "We couldn't load availability, please try again",
    errorBody: (phone: string) =>
      `If the problem persists, message us on WhatsApp at ${phone} and we will confirm the dates with you.`,
    retry: "Try again",
    hintStart: "Tap a date for check-in.",
    hintEnd: "Now tap the check-out date.",
    hintReady: "Dates set. Review the summary and send your request.",
    clearDates: "Clear dates",
    summaryTitle: "Your request",
    checkIn: "Check-in",
    checkOut: "Check-out",
    nights: "Nights",
    unset: "Not set",
    guests: "Guests",
    guestsHint: (max: string) => `Up to ${max} · the rate changes with occupancy`,
    removeGuest: "Remove a guest",
    addGuest: "Add a guest",
    total: "Estimated total",
    average: (amount: string) => `${amount} per night on average`,
    breakfastExtra: (guestsLabel: string, nightsLabel: string, amount: string) =>
      `Breakfast for ${guestsLabel} over ${nightsLabel} would add ${amount}. It is not included in the total.`,
    request: "Request booking on WhatsApp",
    requestReady: "We'll confirm availability and payment on WhatsApp.",
    requestBlocked: "Adjust the dates to meet the minimum stay.",
    requestPending: "Choose your dates to send the request.",
    onlineSoon: "Online payment is coming to this page very soon.",
    prefersTalking: "Rather talk?",
    acceptPolicy: "By booking you accept our",
    acceptPolicyLink: "cancellation policy",
    occupiedRange: (checkIn: string, touched: string, limit: string) =>
      `Some nights between ${checkIn} and ${touched} are already booked: checking in on ${checkIn}, the latest possible check-out was ${limit}. We've started again with check-in on ${touched}.`,
    overCapacity: (name: string, capacity: string) =>
      `${name} sleeps up to ${capacity}.`,
    minStayHelp: (chosen: string, missing: number) =>
      `You chose ${chosen}: add ${missing} more to be able to book.`,
    calendar: {
      prevMonth: "Previous month",
      nextMonth: "Next month",
      available: "Available",
      unavailable: "Unavailable",
      yourDates: "Your dates",
      dayUnavailable: " — unavailable",
    },
  },

  /* --- Experiences ------------------------------------------------------------ */
  experiences: {
    heroEyebrow: "What to do at the Dapa reserve",
    heroTitle: "Experiences between the forest",
    heroTitleAccent: "and the water",
    heroDescription:
      "La Maima is more than a place to sleep. Thirty years of restoration left behind forest trails, a stream with natural pools and a woodland the birds returned to.",
    listHeading: "Experiences at the reserve",
    emptyHelp:
      "Send us a WhatsApp message and we will tell you which experiences are available for your visit.",
    planTitle: "Want to put together",
    planTitleAccent: "your own plan",
    planTitleTail: "?",
    planLead:
      "Tell us how many of you are coming and the dates you have in mind, and we will help you combine a house with the experiences.",
    planCta: "See stays and dates",
    askAbout: (name: string) => `Ask about the ${name} experience on WhatsApp`,
  },

  /* --- Legal documents --------------------------------------------------------- */
  legal: {
    eyebrow: "Legal",
    updated: (date: string) => `Last updated: ${date}`,
    contents: "Contents",
    contentsMobile: "Contents of this document",
    contentsNav: "Contents of this document",
    otherDocs: "Other legal documents",
    pending: (what: string) => `[To be confirmed with La Maima: ${what}]`,
    links: {
      privacy: "Privacy and personal data policy",
      terms: "Booking terms and conditions",
      cancellation: "Cancellation and refund policy",
    },
    short: {
      privacy: "Privacy",
      terms: "Terms",
      cancellation: "Cancellations",
    },
  },

  /* --- 404 ---------------------------------------------------------------------- */
  notFound: {
    metaTitle: "Page not found",
    eyebrow: "Error 404",
    title: "This page got lost",
    titleAccent: "in the forest",
    body: "The address you are looking for doesn't exist or has moved. Here's the way back.",
    home: "Back to home",
    accommodations: "See stays",
  },

  /* --- Footer -------------------------------------------------------------------- */
  footer: {
    blurb:
      "A nature reserve and country hotel in the mountains of Dapa. Thirty years of forest under restoration, six independent houses and the Cauca Valley at your feet.",
    navHeading: "Navigation",
    contactHeading: "Contact",
    nav: "Footer",
    legalNav: "Legal information",
    seeOnMaps: "See on Google Maps",
    rights: (year: number, name: string) => `© ${year} ${name}. All rights reserved.`,
    bookings: (phone: string) => `Bookings and enquiries on WhatsApp ${phone}`,
    instagramAria: (handle: string) => `La Maima on Instagram (${handle})`,
    facebookAria: (handle: string) => `La Maima on Facebook (${handle})`,
  },
};
