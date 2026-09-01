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
    label: "Language",
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
      photoAria: (name: string) => `View ${name}`,
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
    /* Empieza por el texto VISIBLE del botón ("Ask on WhatsApp") — igual que en
       español, donde "Preguntar por WhatsApp sobre X" ya lo contenía por pura
       suerte del orden de las palabras. En inglés "Ask about X on WhatsApp"
       partía la frase visible en dos y axe lo marcaba como discrepancia
       nombre-accesible/contenido-visible. */
    askAbout: (name: string) => `Ask on WhatsApp about ${name}`,
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
    request: "Request booking",
    requestWhatsapp: "I'd rather ask on WhatsApp",
    requestReady: "Next: your details. We reply within 48 hours.",
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

    /* --- Step 2: guest details ------------------------------------------- */
    form: {
      eyebrow: "Step 2 of 2",
      title: "Your details",
      lead: "We'll hold your dates and write to you to confirm.",
      back: "Change dates",
      recapTitle: "Your stay",
      checking: "Checking availability…",

      name: "Full name",
      namePlaceholder: "As it appears on your ID",
      email: "Email address",
      emailHint: "This is where your request code will arrive.",
      phone: "Phone / WhatsApp",
      phoneHint: "The fastest way for us to confirm.",
      guests: "Guests",
      notes: "Anything we should know",
      notesOptional: "optional",
      notesPlaceholder:
        "Approximate arrival time, pets, celebrations, allergies…",
      honeypot: "Leave this field empty",

      policyBefore: "I have read and accept the",
      policyLink: "cancellation policy",
      policyAfter: "",

      submit: "Send request",
      submitting: "Sending…",
      errorSummary: "Please check the highlighted fields.",
      required: "required",

      errors: {
        "name-required": "Please enter your full name.",
        "name-too-short": "That name looks incomplete.",
        "name-too-long": "That name is too long.",
        "email-required": "Please enter your email address.",
        "email-invalid": "That email doesn't look right. Check the @ and the domain.",
        "email-too-long": "That email is too long.",
        "phone-required": "Please enter a phone number we can reach you on.",
        "phone-too-short": "That phone number looks incomplete.",
        "phone-too-long": "That phone number is too long.",
        "notes-too-long": "That note is very long — could you shorten it?",
        "policy-required": "Please accept the cancellation policy to continue.",
      },

      failures: {
        "dates-taken":
          "Those dates have just been taken. Go back to the calendar and pick others — availability is already up to date.",
        "invalid-dates":
          "Those dates are no longer valid. Go back to the calendar and choose again.",
        "min-stay": "That season has a minimum stay.",
        "over-capacity": "That accommodation doesn't sleep that many guests.",
        "not-found": "That accommodation is no longer available.",
        "rate-limited":
          "We received several requests from you in a row. Give it a moment, or message us on WhatsApp and we'll take it right away.",
        unconfigured:
          "We can't register the request right now. Message us on WhatsApp and we'll take it for you.",
        server:
          "We couldn't register your request. Please try again; if it keeps failing, message us on WhatsApp.",
      },
    },

    /* --- Step 3: request registered -------------------------------------- */
    success: {
      eyebrow: "Request registered",
      title: "Done — your dates are on hold",
      codeLabel: "Your request code",
      hold: (deadline: string) =>
        `Your request is registered and the dates are held for 48 hours (until ${deadline}) while our team confirms.`,
      contact: "We'll get in touch on WhatsApp or by email.",
      emailSent: (email: string) => `We sent a copy to ${email}.`,
      onlineSoon: "Online payment is coming to this page very soon.",
      summaryTitle: "Request summary",
      accommodation: "Accommodation",
      whatsapp: "Message us on WhatsApp",
      whatsappMessage: (code: string, accommodation: string) =>
        `Hi! I submitted request ${code} for ${accommodation}. Could you confirm?`,
      again: "Make another request",
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
    /* Mismo motivo que en `detail.askAbout`: el rótulo hablado arranca con el
       texto que se ve pintado en el botón. */
    askAbout: (name: string) => `Ask on WhatsApp about the ${name} experience`,
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
