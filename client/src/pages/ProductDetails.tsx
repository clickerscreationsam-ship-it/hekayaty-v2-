import { useRoute, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { useProduct } from "@/hooks/use-products";
import { useReviews, useCreateReview } from "@/hooks/use-reviews";
import { useUser, useUserById } from "@/hooks/use-users";
import { useAddToCart } from "@/hooks/use-cart";
import { useLikeProduct } from "@/hooks/use-social";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Star, ShieldCheck, Download, ShoppingCart, Heart, BookOpen, Truck, MapPin, Info } from "lucide-react";
import { useShippingRates } from "@/hooks/use-shipping";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

export default function ProductDetails() {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [, params] = useRoute("/book/:id");
  const id = parseInt(params?.id || "0");

  const { data: product, isLoading } = useProduct(id);
  const { data: user } = useUser("mockuser");
  const { data: reviews } = useReviews(id);

  const addToCart = useAddToCart();
  const likeProduct = useLikeProduct();

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div>Product not found</div>;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Book",
    "name": product.title,
    "description": product.description,
    "image": product.coverUrl,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EGP",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "url": window.location.href
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating / 10,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <SEO
        title={product.title}
        description={product.description}
        image={product.coverUrl}
        type="book"
        schema={productSchema}
      />
      <Navbar />

      {/* Full Page Background (Product Cover) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${product.coverUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Hero / Header */}
      <div className="relative pt-32 pb-12 px-4 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10">
          {/* Cover */}
          <div className="w-full md:w-1/3 max-w-[300px] mx-auto md:mx-0 shrink-0">
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
              <img src={product.coverUrl} alt={product.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                {product.genre}
              </span>
              {product.rating ? (
                <div className="flex items-center gap-1 text-yellow-500 font-medium">
                  <Star className="w-4 h-4 fill-current" /> {product.rating / 10}
                </div>
              ) : null}
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">{product.title}</h1>
            <p className="text-xl text-muted-foreground mb-8 line-clamp-3">{product.description}</p>

            <div className="flex flex-col gap-6">
              {product.type === "physical" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {product.stockQuantity !== null && (
                      <div className={`flex items-center gap-2 font-semibold text-sm px-3 py-1 rounded-full border ${product.stockQuantity > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} Units in Stock` : 'Out of Stock'}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                      <Truck className="w-4 h-4" />
                      Physical Product • Shipping Required
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10 shadow-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg disabled:opacity-50"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-lg tabular-nums">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {product.type === "ebook" && (
                  <div className="w-full flex items-center gap-2 text-[10px] text-green-500 font-bold uppercase tracking-widest mb-2 px-2">
                    <ShieldCheck className="w-3 h-3" />
                    {t("studio.guide.save") ? "Protected Digital Content • Anti-Theft Protection" : "Protected Digital Content • Anti-Theft Protection"}
                  </div>
                )}
                {product.type === "promotional" ? (
                  <div className="w-full bg-primary/10 border border-primary/20 p-6 rounded-2xl text-center">
                    <p className="font-bold text-primary mb-1 uppercase tracking-widest text-sm">
                      {t("dashboard.products.types.promotional")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("marketplace.promotionalDesc") || "This item is for showcase only and cannot be purchased."}
                    </p>
                  </div>
                ) : (
                  <>
                    {product.price === 0 || product.price === 0.00 ? (
                      <Link href={`/read/${product.id}`} className="w-full sm:w-auto">
                        <Button className="w-full h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 bg-green-600 hover:bg-green-700 rounded-2xl transition-all hover:scale-[1.02]">
                          <BookOpen className="mr-2 w-5 h-5" />
                          Read Now (Free)
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={() => addToCart.mutate({
                          productId: product.id,
                          quantity: quantity,
                          userId: user?.id || "1"
                        })}
                        disabled={addToCart.isPending}
                        className="w-full sm:w-auto h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 rounded-2xl group transition-all hover:scale-[1.02]"
                      >
                        <ShoppingCart className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                        {addToCart.isPending ? "Adding..." : (
                          <span>
                            Add to Cart • <span className="font-serif">{(product.price * quantity)} EGP</span>
                          </span>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-full border-2 hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                      onClick={() => likeProduct.mutate(product.id)}
                    >
                      <Heart className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" /> Secure Payment
              </div>
              {product.requiresShipping ? (
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-500" /> Physical Product (Shipping Required)
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" /> Instant Digital Access
                </div>
              )}
              {product.type === "asset" && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                    <span className="font-semibold text-foreground">License:</span>
                    {product.licenseType === "commercial" ? "Commercial Use" : "Personal Use"}
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50">
                    <span className="font-semibold text-foreground">File:</span> ZIP / PSD
                  </div>
                </>
              )}
            </div>

            {/* Shipping Availability Section */}
            {product.type === "physical" && product.writerId && (
              <ShippingAvailability creatorId={product.writerId} />
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-4xl mx-auto px-4 mt-20">
        <h2 className="text-2xl font-serif font-bold mb-8">Reader Reviews ({reviews?.length || 0})</h2>
        <ReviewForm productId={id} />

        <div className="space-y-6 mt-10">
          {reviews?.map((review) => (
            <div key={review.id} className="p-6 glass-card rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-500">
                  {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < (review.rating / 10) ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-muted-foreground">Verified Reader</span>
              </div>
              <p className="text-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div >
  );
}

function ShippingAvailability({ creatorId }: { creatorId: string }) {
  const { data: rates, isLoading: isRatesLoading } = useShippingRates(creatorId);
  const { data: creator, isLoading: isCreatorLoading } = useUserById(creatorId);

  const isLoading = isRatesLoading || isCreatorLoading;

  if (isLoading) return <div className="mt-6 animate-pulse h-10 bg-muted rounded-xl" />;
  if (!rates || rates.length === 0) return null;

  return (
    <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4 text-amber-500 font-bold">
        <MapPin className="w-5 h-5" />
        <span>Shipping Available To:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rates.map((rate) => (
          <div key={rate.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{rate.regionName}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {rate.deliveryTimeMin}-{rate.deliveryTimeMax} Business Days
              </span>
            </div>
            <span className="text-primary font-bold font-serif text-sm">
              {rate.amount === 0 ? 'FREE' : `${rate.amount} EGP`}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 text-[10px] text-muted-foreground leading-tight">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <p>Shipping costs are calculated automatically at checkout based on your selection. Delivery times are estimated from the moment of dispatch.</p>
      </div>

      {creator?.shippingPolicy && (
        <div className="mt-6 pt-6 border-t border-amber-500/10 text-sm">
          <p className="font-bold text-amber-500/80 mb-2">Creator's Delivery Notes:</p>
          <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {creator.shippingPolicy}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ productId }: { productId: number }) {
  const { user } = useAuth();
  const createReview = useCreateReview();
  const formSchema = insertReviewSchema.extend({
    rating: z.coerce.number(),
    userId: z.string(),
    productId: z.coerce.number(),
    comment: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: user?.id, productId, rating: 50, comment: "" }
  });

  if (!user) return <div className="p-4 text-center glass-card rounded-xl">Please login to write a review.</div>;

  return (
    <form onSubmit={handleSubmit((data) => createReview.mutate(data, { onSuccess: () => reset() }))} className="mb-10 p-6 bg-muted/30 rounded-xl">
      <h3 className="font-bold mb-4">Write a Review</h3>
      <div className="space-y-4">
        <textarea
          {...register("comment")}
          className="w-full p-4 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          placeholder="What did you think of the story?"
          rows={3}
        />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rating:</span>
            <select {...register("rating")} className="bg-transparent font-bold text-primary outline-none cursor-pointer">
              <option value="50">5 Stars</option>
              <option value="40">4 Stars</option>
              <option value="30">3 Stars</option>
              <option value="20">2 Stars</option>
              <option value="10">1 Star</option>
            </select>
          </div>
          <Button disabled={createReview.isPending} size="sm">
            {createReview.isPending ? "Posting..." : "Post Review"}
          </Button>
        </div>
      </div>
    </form>
  );
}
