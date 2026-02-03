import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    schema?: any;
}

export function SEO({
    title,
    description,
    image = '/og-image.png',
    url,
    type = 'website',
    schema
}: SEOProps) {
    const { i18n } = useTranslation();
    const siteTitle = 'Hekayaty - حكاياتي';
    const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} | Every Writer Deserves a World`;
    const defaultDescription = "Build your own digital bookstore, connect with readers, and sell your stories directly. The universe for storytellers and worldbuilders.";

    return (
        <Helmet>
            <html lang={i18n.language} />
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <link rel="canonical" href={url || typeof window !== 'undefined' ? window.location.href : ''} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={image} />
            {url && <meta property="og:url" content={url} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}
