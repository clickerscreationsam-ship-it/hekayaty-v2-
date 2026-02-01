import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useWriters } from "@/hooks/use-users";
import { FeaturedWriter } from "@/components/FeaturedWriter";
import { Search, Users } from "lucide-react";
import writersBg from "@/assets/WhatsApp Image 2026-01-07 at 8.17.48 PM.jpeg";

export default function Writers() {
    const [search, setSearch] = useState("");
    const { data: writers, isLoading } = useWriters();

    const filteredWriters = writers?.filter(writer =>
        writer.displayName.toLowerCase().includes(search.toLowerCase()) ||
        (writer.bio && writer.bio.toLowerCase().includes(search.toLowerCase())) ||
        writer.username.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            {/* Immersive Background Layer */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
                style={{ backgroundImage: `url(${writersBg})` }}
            />

            <div className="relative z-10">
                <Navbar />

                <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl font-serif font-bold mb-4 text-white">
                            Worldbuilders Gallery
                        </h1>
                        <p className="text-white/80 text-lg max-w-2xl mx-auto">
                            Meet the architects of imagination. Discover writers and artists
                            who are crafting the next generation of legendary stories.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mb-16">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name, username or bio..."
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none backdrop-blur-md"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Writers Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredWriters.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredWriters.map(writer => (
                                <FeaturedWriter key={writer.id} writer={writer} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10">
                            <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-white/10 mb-4">
                                <Users className="w-10 h-10 text-white/40" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif mb-2 text-white">No worldbuilders found</h3>
                            <p className="text-white/60">Try searching for a different name or specialty.</p>
                        </div>
                    )}
                </div>

                <Footer />
            </div>
        </div>
    );
}
