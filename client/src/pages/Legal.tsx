import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield, FileText, Lock, Scale, HelpCircle, Sparkles, PenTool, DollarSign, Edit2 } from "lucide-react";
import dashboardBg from "@/assets/9814ae82-9631-4241-a961-7aec31f9aa4d_09-11-19.png";
import { SEO } from "@/components/SEO";

export default function Legal() {
    const { i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    return (
        <div className="min-h-screen relative flex flex-col">
            <SEO
                title={isArabic ? "سياسة الخصوصية والشروط" : "Privacy & Terms"}
                description="Legal agreements for Hekayaty Store."
            />
            <Navbar />

            {/* Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${dashboardBg})` }}
            />
            <div className="fixed inset-0 z-0 bg-black/80 backdrop-blur-[4px]" />

            <div className="relative z-10 pt-32 pb-20 flex-grow">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight">
                            {isArabic ? "سياسة الخصوصية وشروط الاستخدام" : "Privacy Policy & Terms of Service"}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {isArabic
                                ? "دليلك لفهم كيفية حماية بياناتك وحقوقك داخل منصة حكاياتي."
                                : "Your guide to understanding how we protect your data and rights on Hekayaty."}
                        </p>
                    </motion.div>

                    {/* Privacy Policy */}
                    <section className="glass-card rounded-3xl p-8 md:p-12 mb-12 border border-white/10 relative overflow-hidden shadow-2xl backdrop-blur-md">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield size={120} />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-white">
                                {isArabic ? "سياسة الخصوصية – Privacy Policy" : "Privacy Policy"}
                            </h2>
                        </div>

                        <div className={`space-y-8 text-lg leading-relaxed text-muted-foreground ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
                            <p className="text-white/90">
                                {isArabic
                                    ? "مرحبًا بك في Hekayaty! نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. باستخدامك للمنصة، فإنك توافق على جمع واستخدام بياناتك كما هو موضح في هذه السياسة."
                                    : "Welcome to Hekayaty! We are committed to protecting your privacy and personal data. By using the platform, you agree to the collection and use of your data as described in this policy."}
                            </p>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    {isArabic ? "1. البيانات التي نجمعها" : "1. Data We Collect"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "بيانات التسجيل: الاسم، البريد الإلكتروني، كلمة المرور." : "Registration data: Name, email, password."}</li>
                                    <li>{isArabic ? "المحتوى: القصص، الروايات، الصور أو أي محتوى ترفعه على المنصة." : "Content: Stories, novels, images, or any content you upload to the platform."}</li>
                                    <li>{isArabic ? "النشاط: سجل النشاطات، المشاهدات، التفاعلات داخل الموقع." : "Activity: Log of activities, views, and interactions within the site."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    {isArabic ? "2. كيفية استخدام البيانات" : "2. How We Use Data"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "لإدارة حسابك على المنصة." : "To manage your account on the platform."}</li>
                                    <li>{isArabic ? "لتسهيل نشر وبيع أعمالك من خلال الحساب الداخلي للمنصة." : "To facilitate the publishing and selling of your work through the platform's internal account."}</li>
                                    <li>{isArabic ? "لإرسال إشعارات مهمة حول الحساب أو التحديثات." : "To send important notifications about the account or updates."}</li>
                                    <li>{isArabic ? "لتحليل البيانات بشكل مجهول لتحسين تجربة المستخدم." : "To analyze anonymous data to improve user experience."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    {isArabic ? "3. حماية البيانات" : "3. Data Protection"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "جميع البيانات مشفرة أثناء النقل والتخزين." : "All data is encrypted during transport and storage."}</li>
                                    <li>{isArabic ? "لا نشارك بياناتك مع أي طرف ثالث إلا إذا كان ذلك قانونيًا أو ضروريًا لتقديم الخدمة." : "We do not share your data with any third party unless legally required or necessary to provide the service."}</li>
                                    <li>{isArabic ? "لدينا آليات لمنع الاختراق أو أي استخدام غير مصرح به." : "We have mechanisms to prevent hacking or any unauthorized use."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                    {isArabic ? "4. حقوقك" : "4. Your Rights"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "الاطلاع على بياناتك وحذفها عند الطلب." : "Accessing your data and deleting it upon request."}</li>
                                    <li>{isArabic ? "سحب الموافقة على استخدام بياناتك في أي وقت." : "Withdrawing consent to use your data at any time."}</li>
                                    <li>{isArabic ? "الاعتراض على أي استخدام غير قانوني للبيانات." : "Objecting to any illegal use of data."}</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Terms of Service */}
                    <section className="glass-card rounded-3xl p-8 md:p-12 mb-12 border border-white/10 relative overflow-hidden shadow-2xl backdrop-blur-md">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Scale size={120} />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <Scale className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-white">
                                {isArabic ? "شروط الاستخدام – Terms of Service" : "Terms of Service"}
                            </h2>
                        </div>

                        <div className={`space-y-8 text-lg leading-relaxed text-muted-foreground ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-primary" />
                                    {isArabic ? "1. الحساب والمحتوى" : "1. Account & Content"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "أنت مسؤول عن أي محتوى ترفعه على المنصة." : "You are responsible for any content you upload to the platform."}</li>
                                    <li>{isArabic ? "يجب ألا ينتهك محتواك حقوق أي طرف ثالث أو القوانين المحلية والدولية." : "Your content must not violate the rights of any third party or local and international laws."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-primary" />
                                    {isArabic ? "2. البيع على Hekayaty" : "2. Selling on Hekayaty"}
                                </h3>
                                <p className="mb-2">
                                    {isArabic
                                        ? "بعد أول بيع لك، ستحصل على حصة من الأرباح مباشرة حسب نظام الحساب الداخلي للمنصة (افتراضياً 80% للمبدع)."
                                        : "After your first sale, you will receive a share of the profits directly according to the platform's internal account system (typically 80% for creators)."}
                                </p>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "المنصة تحتفظ بحق تعديل نسب الأرباح مع إعلام المستخدمين قبل أي تغييرات." : "The platform reserves the right to modify profit shares, with prior notice to users before any changes."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    {isArabic ? "3. الالتزامات القانونية" : "3. Legal Obligations"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "يجب على كل مستخدم الالتزام بالقوانين المحلية المتعلقة بحقوق النشر والتجارة الإلكترونية." : "Every user must comply with local laws regarding copyright and e-commerce."}</li>
                                    <li>{isArabic ? "Hekayaty ليست مسؤولة عن أي انتهاك قانوني يقوم به المستخدم خارج نطاق المنصة." : "Hekayaty is not responsible for any legal violation committed by the user outside the platform's scope."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                    {isArabic ? "4. المسؤولية" : "4. Liability"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "المنصة متاحة “كما هي”، ولا تتحمل أي خسائر مالية ناتجة عن استخدام المنصة من قبل المستخدمين." : "The platform is available 'as is,' and does not assume any financial losses resulting from the use of the platform by users."}</li>
                                    <li>{isArabic ? "نحتفظ بالحق في تعليق أو إنهاء أي حساب ينتهك القوانين أو الشروط." : "We reserve the right to suspend or terminate any account that violates laws or terms."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary" />
                                    {isArabic ? "5. حماية Hekayaty" : "5. Hekayaty Protection"}
                                </h3>
                                <ul className={`list-disc list-inside space-y-2 ${isArabic ? 'mr-4' : 'ml-4'}`}>
                                    <li>{isArabic ? "جميع البيانات والأصول محمية بموجب قوانين الملكية الفكرية." : "All data and assets are protected under intellectual property laws."}</li>
                                    <li>{isArabic ? "أي محاولة للتلاعب بالنظام أو الاحتيال ستؤدي لاتخاذ الإجراءات القانونية الفورية." : "Any attempt to manipulate the system or fraud will lead to immediate legal action."}</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-primary" />
                                    {isArabic ? "6. التعديلات" : "6. Amendments"}
                                </h3>
                                <p>
                                    {isArabic
                                        ? "نحتفظ بحق تعديل هذه السياسة والشروط في أي وقت، مع إعلام المستخدمين بالتغييرات المهمة."
                                        : "We reserve the right to modify this policy and terms at any time, with users informed of significant changes."}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    );
}
