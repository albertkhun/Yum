import { useEffect } from 'react';

export function buildListingSchema(listing) {
  if (!listing) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",

    name: listing.title,

    description: listing.description,

    image: listing.images || [],

    address: {
      "@type": "PostalAddress",

      addressLocality: listing.location?.locality,

      addressRegion: listing.location?.district,

      addressCountry: "IN"
    },

    offers: {
      "@type": "Offer",

      price: listing.price?.amount,

      priceCurrency: "INR",

      availability:
        listing.status === 'available'
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut"
    }
  };
}

export function buildBreadcrumbSchema(items = []) {

  return {
    "@context": "https://schema.org",

    "@type": "BreadcrumbList",

    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",

      position: index + 1,

      name: item.name,

      item: `https://yumvr.tech${item.path}`
    }))
  };
}

export function useSEO({
  title = 'YumVR',
  description = 'VR powered rental platform in Manipur',
  image = 'https://yumvr.tech/og-image.jpg',
  url = 'https://yumvr.tech',
  type = 'website',
  schema = null
}) {

  useEffect(() => {

    // Title
    document.title = title;

    // Meta helper
    const setMeta = (selector, content) => {

      if (!content) return;

      const element = document.querySelector(selector);

      if (element) {
        element.setAttribute('content', content);
      }
    };

    // Basic SEO
    setMeta('meta[name="description"]', description);

    // Open Graph
    setMeta('meta[property="og:title"]', title);

    setMeta('meta[property="og:description"]', description);

    setMeta('meta[property="og:image"]', image);

    setMeta('meta[property="og:url"]', url);

    setMeta('meta[property="og:type"]', type);

    // Twitter
    setMeta('meta[name="twitter:title"]', title);

    setMeta('meta[name="twitter:description"]', description);

    setMeta('meta[name="twitter:image"]', image);

    // Canonical URL
    let canonical =
      document.querySelector("link[rel='canonical']");

    if (!canonical) {

      canonical = document.createElement('link');

      canonical.setAttribute('rel', 'canonical');

      document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', url);

    // Structured Data
    const oldSchema =
      document.getElementById('dynamic-schema');

    if (oldSchema) {
      oldSchema.remove();
    }

    if (schema) {

      const script =
        document.createElement('script');

      script.type = 'application/ld+json';

      script.id = 'dynamic-schema';

      script.innerHTML = JSON.stringify(schema);

      document.head.appendChild(script);
    }

    // Cleanup
    return () => {

      const schemaScript =
        document.getElementById('dynamic-schema');

      if (schemaScript) {
        schemaScript.remove();
      };
    };

  }, [
    title,
    description,
    image,
    url,
    type,
    schema
  ]);
}