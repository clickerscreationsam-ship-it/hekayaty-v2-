import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import {
    Book,
    ShieldCheck,
    Truck,
    CreditCard,
    HelpCircle,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    Users,
    Info,
    Scale,
    Ban,
    PenTool,
    Clock,
    DollarSign,
    Gamepad2,
    Lock
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

export default function HekayatyGuide() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            <SEO
                title={isArabic ? "دليل استخدام منصة حكاياتي" : "Hekayaty Platform Guide"}
                description="Learn how to use Hekayaty for writers and readers. Guides for publishing, buying, shipping, and community rules."
            />
            <Navbar />

            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                            <Info className="w-4 h-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {isArabic ? "دليل المستخدم" : "Platform Guide"}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-gradient mb-6 leading-tight">
                            {isArabic ? "📘 دليل استخدام منصة Hekayaty" : "📘 Hekayaty Platform Guide"}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            {isArabic
                                ? "للكُتّاب (Writers) والقرّاء (Readers)"
                                : "For Writers and Readers"}
                        </p>
                        <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl inline-block">
                            <p className="text-sm text-amber-500 font-medium leading-relaxed">
                                ⚠️ {isArabic
                                    ? "المنصة تعمل كوسيط تقني فقط، وليست طرفًا مباشرًا في الإنتاج أو الشحن."
                                    : "The platform acts only as a technical intermediary and is not a direct party to production or shipping."}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-12"
                    >
                        {/* Section 1: Writers */}
                        <motion.section variants={itemVariants} className="glass-card rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <PenTool className="w-32 h-32" />
                            </div>

                            <h2 className="text-3xl font-serif font-bold text-primary mb-10 flex items-center gap-3">
                                <PenTool className="w-8 h-8" />
                                {isArabic ? "✍️ أولًا: دليل الكُتّاب (Writers Guide)" : "✍️ First: Writers Guide"}
                            </h2>

                            <div className="grid gap-10">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        {isArabic ? "1️⃣ نشر الأعمال" : "1️⃣ Publishing Works"}
                                    </h3>
                                    <p className="text-muted-foreground ml-4 leading-relaxed">
                                        {isArabic
                                            ? "يحق لكل كاتب نشر أعماله (كتب رقمية، قصص، أو منتجات مادية). الكاتب مسؤول مسؤولية كاملة عن المحتوى المنشور وصحته وملكيته الفكرية."
                                            : "Every writer can publish their works (digital books, stories, or physical products). The writer is fully responsible for the content, its accuracy, and intellectual property."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Book className="w-5 h-5 text-blue-500" />
                                        {isArabic ? "2️⃣ الكتب الرقمية (E-books)" : "2️⃣ Digital Books (E-books)"}
                                    </h3>
                                    <p className="text-muted-foreground ml-4 leading-relaxed">
                                        {isArabic
                                            ? "يتم تسليم المنتج رقميًا عبر المنصة. حكاياتي مسؤولة عن نظام التحميل فقط، وليس عن محتوى الكتاب."
                                            : "Products are delivered digitally via the platform. Hekayaty is responsible for the delivery system only, not the content."}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Truck className="w-5 h-5 text-amber-500" />
                                        {isArabic ? "3️⃣ المنتجات المادية (Physical Products)" : "3️⃣ Physical Products"}
                                    </h3>
                                    <div className="ml-4 space-y-4">
                                        <p className="text-muted-foreground leading-relaxed">{isArabic ? "في حالة المنتجات المادية (Box Collection - كتب مطبوعة):" : "For physical products (Box Collections - Printed Books):"}</p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                                <p className="font-bold text-green-500 text-sm mb-2">{isArabic ? "✅ الكاتب مسؤول عن:" : "✅ Writer Responsible For:"}</p>
                                                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                                                    <li>{isArabic ? "شحن المنتج وتغليفه" : "Shipping and packaging"}</li>
                                                    <li>{isArabic ? "الالتزام بمدة الشحن" : "Adhering to shipping duration"}</li>
                                                </ul>
                                            </div>
                                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                                <p className="font-bold text-red-500 text-sm mb-2">{isArabic ? "❌ حكاياتي غير مسؤولة عن:" : "❌ Hekayaty Not Responsible For:"}</p>
                                                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                                                    <li>{isArabic ? "الشحن أو التأخير" : "Shipping or delays"}</li>
                                                    <li>{isArabic ? "التلف أثناء الشحن" : "Damage during transit"}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Info className="w-5 h-5 text-blue-400" />
                                        {isArabic ? "4️⃣ بيانات الشحن (إلزامية)" : "4️⃣ Shipping Data (Mandatory)"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground ml-4 leading-relaxed">
                                        {isArabic
                                            ? "عند إضافة منتج مادي، يجب كتابة: المناطق التي تشحن إليها، التكلفة، المدة المتوقعة، وأي شروط خاصة. عدم توضيح هذه البيانات قد يؤدي لإيقاف الحساب."
                                            : "For physical products, you must specify: Shipping zones, costs, duration, and any special terms. Failure to provide this may lead to account suspension."}
                                    </p>
                                </div>

                                <div className="space-y-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                                        <DollarSign className="w-5 h-5" />
                                        {isArabic ? "5️⃣ الأرباح ونظام الدفع" : "5️⃣ Earnings & Payments"}
                                    </h3>
                                    <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside ml-4">
                                        <li>{isArabic ? "يتم حجز المبلغ داخل المنصة لضمان العملية." : "Funds are held within the platform to secure the process."}</li>
                                        <li>{isArabic ? "المنصة تخصم 20% عمولة." : "The platform deducts a 20% commission."}</li>
                                        <li>{isArabic ? "تضاف الأرباح لرصيدك فور تأكيد العملية." : "Profits are added to your balance upon confirmation."}</li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Clock className="w-5 h-5 text-green-400" />
                                        {isArabic ? "6️⃣ طلب سحب الأرباح (Payout)" : "6️⃣ Withdrawal (Payout)"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground ml-4">
                                        {isArabic
                                            ? "يمكنك طلب سحب أرباحك في أي وقت، وسيتم تحويل المبلغ خلال 24 ساعة عبر وسيلة الدفع المختارة."
                                            : "You can request withdrawal anytime; funds are transferred within 24 hours via chosen payment method."}
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 2: Readers */}
                        <motion.section variants={itemVariants} className="glass-card rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <Users className="w-32 h-32" />
                            </div>

                            <h2 className="text-3xl font-serif font-bold text-accent mb-10 flex items-center gap-3">
                                <Users className="w-8 h-8" />
                                {isArabic ? "📖 ثانيًا: دليل القرّاء (Readers Guide)" : "📖 Second: Readers Guide"}
                            </h2>

                            <div className="grid gap-10">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <HelpCircle className="w-5 h-5 text-primary" />
                                        {isArabic ? "1️⃣ قبل الشراء" : "1️⃣ Before Buying"}
                                    </h3>
                                    <p className="text-muted-foreground ml-4 leading-relaxed">
                                        {isArabic
                                            ? "على القارئ مراجعة وصف المنتج (رقمي/مادي)، تكلفة الشحن، مدة التوصيل، وسياسة الكاتب. الشراء يعني الموافقة على هذه الشروط."
                                            : "Readers must check product type (digital/physical), shipping cost, duration, and writer policy. Buying denotes agreement."}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Lock className="w-5 h-5 text-green-500" />
                                        {isArabic ? "2️⃣ الدفع" : "2️⃣ Payment"}
                                    </h3>
                                    <p className="text-muted-foreground ml-4 leading-relaxed">
                                        {isArabic
                                            ? "يتم الدفع عبر بوابة حكاياتي، وتكون الأموال محفوظة مؤقتًا لضمان الأمان."
                                            : "Payments are made via Hekayaty gateway; funds are held temporarily for security."}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Gamepad2 className="w-5 h-5 text-blue-500" />
                                        {isArabic ? "3️⃣ استلام المنتج" : "3️⃣ Receival"}
                                    </h3>
                                    <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside ml-4">
                                        <li>{isArabic ? "الرقمية: تسلم فورًا عبر الموقع." : "Digital: Delivered instantly via site."}</li>
                                        <li>{isArabic ? "المادية: تشحن مباشرة من الكاتب." : "Physical: Shipped directly from writer."}</li>
                                        <li>{isArabic ? "أي تأخير في الشحن يتم حله مع الكاتب مباشرة." : "Any shipping delays are resolved with the writer directly."}</li>
                                    </ul>
                                </div>
                            </div>
                        </motion.section>

                        {/* Section 3: Legal & Rules */}
                        <motion.section variants={itemVariants} className="space-y-8">
                            <div className="p-8 md:p-12 rounded-3xl bg-secondary/10 border border-secondary/20 relative">
                                <h2 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
                                    <Scale className="w-8 h-8 text-primary" />
                                    {isArabic ? "⚖️ ملاحظات قانونية مهمة" : "⚖️ Important Legal Notes"}
                                </h2>
                                <p className="text-muted-foreground leading-relaxed mb-6">
                                    {isArabic
                                        ? "حكاياتي منصة وسيطة، غير مسؤولة عن جودة المحتوى أو الشحن. النزاعات تحل مباشرة بين الأطراف."
                                        : "Hekayaty is an intermediary; not responsible for content quality or shipping. Disputes resolved between parties."}
                                </p>
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <p className="text-sm font-bold text-red-500">
                                        ⚠️ {isArabic
                                            ? "في حال الاحتيال أو المخالفة، يتم حظر الحساب نهائيًا بدون تعويض."
                                            : "In case of fraud or violation, account is permanently banned without compensation."}
                                    </p>
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-8 md:p-12 border border-red-500/20 relative">
                                <h2 className="text-3xl font-serif font-bold text-red-500 mb-8 flex items-center gap-3">
                                    <AlertTriangle className="w-8 h-8" />
                                    {isArabic ? "🚨 قواعد المجتمع والدردشة" : "🚨 Community & Chat Rules"}
                                </h2>

                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2 text-white">
                                            <MessageSquare className="w-5 h-5 text-blue-400" />
                                            {isArabic ? "الدردشة" : "Chat Rules"}
                                        </h3>
                                        <ul className="text-xs space-y-2 text-muted-foreground">
                                            <li>❌ {isArabic ? "التنمر، التهديد، أو الألفاظ المسيئة" : "Bullying, threats, or offensive language"}</li>
                                            <li>❌ {isArabic ? "العنصرية أو التحريض على الكراهية" : "Racism or inciting hate"}</li>
                                            <li>❌ {isArabic ? "المحتوى الجنسي أو الروابط الضارة" : "Sexual content or harmful links"}</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold flex items-center gap-2 text-white">
                                            <Ban className="w-5 h-5 text-red-400" />
                                            {isArabic ? "المحتوى" : "Content Rules"}
                                        </h3>
                                        <ul className="text-xs space-y-2 text-muted-foreground">
                                            <li>❌ {isArabic ? "الأعمال المسروقة (حقوق الملكية)" : "Stolen works (IP violation)"}</li>
                                            <li>❌ {isArabic ? "المحتوى غير القانوني أو العنيف" : "Illegal or violent content"}</li>
                                            <li>❌ {isArabic ? "كل ما يخالف الذوق العام والقانون" : "Violating public taste or law"}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Final Agreement */}
                        <motion.div variants={itemVariants} className="text-center p-8 bg-primary/20 rounded-3xl border border-primary/30">
                            <h3 className="text-2xl font-bold mb-4">{isArabic ? "✅ الموافقة" : "✅ Agreement"}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {isArabic
                                    ? "باستخدامك لمنصة Hekayaty، فأنت توافق على جميع القواعد والتحذيرات المذكورة وتتعهد بالالتزام بها كاملًا."
                                    : "By using Hekayaty, you agree to all mentioned rules and warnings and pledge full compliance."}
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
