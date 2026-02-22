import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useCart, useRemoveFromCart, useCheckout, useCalculateShipping, useUpdateCartQuantity } from "@/hooks/use-cart";
import { useShippingAddresses } from "@/hooks/use-shipping";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ShoppingBag, CreditCard, Banknote, Smartphone, Receipt, Upload, Truck, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload"; // We need this import

export default function Cart() {
    const { data: cartItems, isLoading } = useCart();
    const removeFromCart = useRemoveFromCart();
    const updateQuantity = useUpdateCartQuantity();
    const checkout = useCheckout();
    const [, setLocation] = useLocation();

    // Verification Dialog State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Shipping (if needed), 2: Payment

    // Shipping State
    const calculateShipping = useCalculateShipping();
    const [shippingDetails, setShippingDetails] = useState({
        fullName: "",
        phoneNumber: "",
        city: "",
        addressLine: ""
    });
    const [shippingCost, setShippingCost] = useState(0);
    const [shippingBreakdown, setShippingBreakdown] = useState<any[]>([]);

    // User Addresses
    const { data: userAddresses } = useShippingAddresses();



    // Payment State
    const [paymentMethod, setPaymentMethod] = useState("instapay");
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [reference, setReference] = useState("");

    // Filter out invalid items where product or collection might be null (deleted product)
    const validItems = cartItems?.filter((item: any) => item.product || item.collection) || [];

    const digitalItems = validItems.filter((item: any) => !item.product?.requiresShipping && !item.collection);
    const physicalItems = validItems.filter((item: any) => item.product?.requiresShipping);
    const collectionItems = validItems.filter((item: any) => !!item.collection);

    // Group all digital (stories, assets, collections)
    const allDigital = [...digitalItems, ...collectionItems];
    const hasPhysical = physicalItems.length > 0;
    const hasDigital = allDigital.length > 0;
    const isMixed = hasPhysical && hasDigital;

    const itemsTotal = validItems.reduce((sum: number, item: any) => {
        const price = item.product?.price || item.collection?.price || 0;
        return sum + price * (item.quantity || 1);
    }, 0);

    const grandTotal = itemsTotal + shippingCost;

    // Auto-calculate shipping if user has an address
    useEffect(() => {
        if (hasPhysical && userAddresses && userAddresses.length > 0 && shippingCost === 0 && !calculateShipping.isPending) {
            const latestAddress = userAddresses[0];

            // Sync state for checkout dialog
            setShippingDetails({
                fullName: latestAddress.fullName,
                phoneNumber: latestAddress.phoneNumber,
                city: latestAddress.city,
                addressLine: latestAddress.addressLine
            });

            // Calculate shipping
            const itemsForShipping = physicalItems.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                price: item.product!.price,
                creatorId: item.product!.writerId
            }));

            if (itemsForShipping.length > 0) {
                calculateShipping.mutate({
                    items: itemsForShipping,
                    city: latestAddress.city.trim()
                }, {
                    onSuccess: (data) => {
                        setShippingCost(data.total);
                        setShippingBreakdown(data.breakdown);
                    }
                });
            }
        }
    }, [hasPhysical, userAddresses, validItems.length]);

    useEffect(() => {
        if (isCheckoutOpen) {
            if (hasPhysical) setStep(1);
            else setStep(2);
        }
    }, [isCheckoutOpen, hasPhysical]);

    const handleCalculateShipping = () => {
        if (!shippingDetails.city) return;

        // Only calculate shipping for physical items
        const itemsForShipping = physicalItems.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            price: item.product!.price,
            creatorId: item.product!.writerId
        }));

        if (itemsForShipping.length === 0) {
            setShippingCost(0);
            setShippingBreakdown([]);
            setStep(2);
            return;
        }

        calculateShipping.mutate({
            items: itemsForShipping,
            city: shippingDetails.city.trim()
        }, {
            onSuccess: (data) => {
                setShippingCost(data.total);
                setShippingBreakdown(data.breakdown);
                setStep(2);
            }
        });
    };

    const handleCheckoutSubmit = () => {
        if (validItems.length === 0) return;

        const allItems = validItems.map((item: any) => ({
            productId: item.productId,
            collectionId: item.collectionId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.product?.price || item.collection?.price || 0,
            creatorId: item.product?.writerId || item.collection?.writerId || null,
            customizationData: item.customizationData
        }));

        checkout.mutate({
            items: allItems,
            totalAmount: grandTotal,
            paymentMethod,
            paymentProofUrl: proofUrl,
            paymentReference: reference,
            shippingAddress: hasPhysical ? shippingDetails : undefined,
            shippingCost: hasPhysical ? shippingCost : undefined,
            shippingBreakdown: hasPhysical ? shippingBreakdown : undefined
        }, {
            onSuccess: () => {
                setIsCheckoutOpen(false);
                setLocation("/dashboard");
            }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Payment Instructions Data
    const paymentInstructions: Record<string, any> = {
        instapay: {
            title: "InstaPay Transfer",
            details: "Transfer to number: 01272404623",
            icon: Smartphone,
            color: "text-purple-600",
            disabled: false
        },
        vodafone_cash: {
            title: "Vodafone Cash (Soon / قريباً)",
            details: "Service integration in progress.",
            icon: Smartphone,
            color: "text-red-600",
            disabled: true
        },
        orange_cash: {
            title: "Orange Cash (Soon / قريباً)",
            details: "Service integration in progress.",
            icon: Smartphone,
            color: "text-orange-600",
            disabled: true
        },
        etisalat_cash: {
            title: "Etisalat Cash (Soon / قريباً)",
            details: "Service integration in progress.",
            icon: Smartphone,
            color: "text-green-600",
            disabled: true
        },
        bank_transfer: {
            title: "Bank Transfer (Soon / قريباً)",
            details: "Direct bank transfer will be available soon.",
            icon: Banknote,
            color: "text-blue-600",
            disabled: true
        }
    };

    const selectedMethodInfo = paymentInstructions[paymentMethod];

    return (
        <div className="min-h-screen pb-20">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32">
                <h1 className="text-4xl font-serif font-bold mb-8 flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-primary" />
                    Your Cart
                </h1>

                {validItems.length === 0 ? (
                    <div className="glass-card p-12 text-center rounded-2xl">
                        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                        <p className="text-muted-foreground mb-8">Looks like you haven't added any stories yet.</p>
                        <Link href="/marketplace">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                                Browse Stories
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Warning for Mixed Cart */}
                            {isMixed && (
                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex gap-3 text-foreground animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-primary/20 p-2 rounded-lg h-fit">
                                        <Truck className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Mixed Order Notice</p>
                                        <p className="text-sm opacity-80">Your cart includes both digital and physical items. Digital items will be unlocked instantly after payment, while physical items will be shipped to your address.</p>
                                    </div>
                                </div>
                            )}

                            {/* Section: Physical Products */}
                            {hasPhysical && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2 text-muted-foreground">
                                        <Truck className="w-5 h-5" />
                                        <h2 className="text-lg font-bold">Physical Products (Requires Shipping)</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {physicalItems.map((item: any) => (
                                            <CartItemRow key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeFromCart} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section: Digital Products */}
                            {hasDigital && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2 text-muted-foreground">
                                        <CreditCard className="w-5 h-5 text-blue-500" />
                                        <h2 className="text-lg font-bold">Digital Products (Instant Access)</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {allDigital.map((item: any) => (
                                            <CartItemRow key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeFromCart} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="glass-card p-6 rounded-xl sticky top-24">
                                <h3 className="font-bold text-xl mb-6">Order Summary</h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{itemsTotal} EGP</span>
                                    </div>
                                    {hasPhysical && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Shipping</span>
                                            <span>
                                                {calculateShipping.isPending ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Calculating...
                                                    </span>
                                                ) : (
                                                    shippingCost > 0 ? `${shippingCost} EGP` : 'Calculated at checkout'
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Platform Fee</span>
                                        <span>Included</span>
                                    </div>
                                    <div className="w-full h-px bg-border" />
                                    {isMixed && (
                                        <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 mb-4">
                                            <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">Split Order Notice</p>
                                            <p className="text-xs opacity-70">Payment will be split into two orders for your convenience.</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{grandTotal} EGP</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg shadow-lg shadow-primary/20"
                                    onClick={() => setIsCheckoutOpen(true)}
                                >
                                    Proceed to Checkout
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Secure local payments supported.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local Payment Checkout Dialog */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-serif">
                                {step === 1 ? "Shipping Details" : "Secure Checkout"}
                            </DialogTitle>
                            <DialogDescription>
                                {step === 1 ? "Where should we send your physical items?" : "Complete your purchase securely."}
                            </DialogDescription>
                        </DialogHeader>

                        {step === 1 ? (
                            <div className="space-y-4 mt-4">
                                <div className="bg-amber-500/10 p-4 rounded-lg flex gap-3 text-amber-600 border border-amber-500/20">
                                    <Truck className="w-5 h-5 shrink-0" />
                                    <p className="text-sm">Some items in your cart require shipping. Please provide a delivery address.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={shippingDetails.fullName}
                                        onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                                        placeholder="Receiver Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={shippingDetails.phoneNumber}
                                        onChange={(e) => setShippingDetails({ ...shippingDetails, phoneNumber: e.target.value })}
                                        placeholder="01xxxxxxxxx"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>City / Governorate</Label>
                                        <Input
                                            value={shippingDetails.city}
                                            onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                            placeholder="e.g. Cairo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Detailed Address</Label>
                                        <Input
                                            value={shippingDetails.addressLine}
                                            onChange={(e) => setShippingDetails({ ...shippingDetails, addressLine: e.target.value })}
                                            placeholder="Street, Building, Apt..."
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="mt-6">
                                    <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={handleCalculateShipping}
                                        disabled={!shippingDetails.city || !shippingDetails.addressLine || calculateShipping.isPending}
                                        className="bg-primary text-white"
                                    >
                                        {calculateShipping.isPending ? "Calculating..." : "Next: Payment"}
                                    </Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <div className="space-y-6 mt-4">
                                {/* Shipping Summary if applicable */}
                                {hasPhysical && (
                                    <div className="bg-muted p-4 rounded-lg border flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span>Shipping to <span className="font-semibold">{shippingDetails.city}</span></span>
                                        </div>
                                        <span className="font-bold">{shippingCost} EGP</span>
                                    </div>
                                )}

                                {/* Step 1: Method Selection (Same as before) */}
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">1. Select Payment Method</Label>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3">
                                        {Object.entries(paymentInstructions).map(([key, info]) => (
                                            <div
                                                key={key}
                                                className={`flex items-center space-x-3 border p-3 rounded-lg transition-all ${info.disabled ? 'opacity-50 cursor-not-allowed bg-muted/20 grayscale' : 'cursor-pointer hover:bg-accent/5'} ${paymentMethod === key ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}`}
                                            >
                                                <RadioGroupItem value={key} id={key} disabled={info.disabled} />
                                                <Label
                                                    htmlFor={key}
                                                    className={`flex-1 flex items-center gap-2 font-medium ${info.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <info.icon className={`w-4 h-4 ${info.color}`} />
                                                    {info.title}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* Step 2: Instructions */}
                                <div className="bg-muted p-4 rounded-lg border border-primary/20">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-primary" />
                                        Payment Instructions
                                    </h4>
                                    <p className="text-sm font-medium mb-1">Transfer <strong>{grandTotal} EGP</strong> to:</p>
                                    <p className="text-lg font-mono bg-background p-2 rounded border select-all text-center">
                                        {selectedMethodInfo.details}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        * Please ensure you transfer the exact amount.
                                    </p>
                                </div>

                                {/* Step 3: Verification */}
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">2. Verify Payment</Label>
                                    <div className="space-y-2">
                                        <Label className="text-sm">Transaction Reference / ID</Label>
                                        <Input
                                            placeholder="e.g. 2349823423"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <CloudinaryUpload
                                            label="Upload Payment Screenshot (Optional but recommended)"
                                            folder="hekayaty_payments"
                                            onUpload={(url) => setProofUrl(url)}
                                            aspectRatio="video" // wider aspect for screenshots
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                                    {hasPhysical && (
                                        <Button variant="ghost" onClick={() => setStep(1)} className="sm:mr-auto">Back</Button>
                                    )}
                                    <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={handleCheckoutSubmit}
                                        disabled={checkout.isPending || !reference}
                                        className="bg-primary hover:bg-primary/90 min-w-[120px]"
                                    >
                                        {checkout.isPending ? "Processing..." : "Confirm Payment"}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

function CartItemRow({ item, onUpdate, onRemove }: any) {
    return (
        <div className="glass-card p-4 rounded-xl flex gap-4 items-center border border-white/5 hover:border-white/10 transition-all shadow-sm">
            <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-muted/30">
                <img
                    src={item.product?.coverUrl || item.collection?.coverUrl || ""}
                    alt={item.product?.title || item.collection?.title || ""}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate mb-1">{item.product?.title || item.collection?.title}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase font-semibold">
                        {item.product?.type || (item.collection ? "Story Collection" : "item")}
                    </span>
                </div>
                <div className="mt-3 text-primary font-bold text-lg">
                    {item.product?.price || item.collection?.price} <span className="text-xs font-normal">EGP</span>
                    {item.quantity && item.quantity > 1 && <span className="text-muted-foreground text-xs font-normal"> x {item.quantity}</span>}
                </div>
            </div>

            {/* Quantity Adjuster */}
            <div className="flex items-center bg-muted/20 rounded-xl p-0.5 border border-border/40">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-background/50 transition-all disabled:opacity-20"
                    onClick={() => onUpdate.mutate({ id: item.id, quantity: Math.max(1, (item.quantity || 1) - 1) })}
                    disabled={onUpdate.isPending || (item.quantity || 1) <= 1}
                >
                    -
                </Button>
                <span className="w-6 text-center font-bold text-sm tabular-nums">{item.quantity || 1}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-background/50 transition-all"
                    onClick={() => onUpdate.mutate({ id: item.id, quantity: (item.quantity || 1) + 1 })}
                    disabled={onUpdate.isPending}
                >
                    +
                </Button>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => onRemove.mutate(item.id)}
                disabled={onRemove.isPending}
            >
                <Trash2 className="w-5 h-5" />
            </Button>
        </div>
    );
}
