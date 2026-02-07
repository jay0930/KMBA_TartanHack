import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black font-[family-name:var(--font-rubik)]">
      {/* Nav */}
      <nav className="flex gap-6 px-[10px] py-[22px] font-[family-name:var(--font-fragment-mono)] text-[15px] uppercase tracking-[-0.6px]">
        <a href="#about" className="hover:opacity-60 transition-opacity">About</a>
        <a href="#directions" className="hover:opacity-60 transition-opacity">Directions</a>
      </nav>

      {/* Header */}
      <header className="px-[10px] pb-8">
        <div className="flex justify-between font-[family-name:var(--font-fragment-mono)] text-[12px] tracking-[-0.48px] mb-4">
          <span>A new fashion company</span>
          <span>@nonsensefashion</span>
        </div>
        <h1 className="font-[family-name:var(--font-rubik-bubbles)] text-[55px] leading-[1.1] tracking-[-2.2px]">
          Nonsense
        </h1>
      </header>

      {/* Main */}
      <main className="px-[10px]">
        {/* Section 2 - Info */}
        <section className="flex flex-col gap-0 mb-6">
          {/* What */}
          <div className="py-6 border-t border-black/10">
            <p className="font-[family-name:var(--font-fragment-mono)] text-[12px] tracking-[-0.48px] mb-2">What:</p>
            <p className="text-[16px] leading-[1.4]">archive sale</p>
          </div>
          {/* When */}
          <div className="py-6 border-t border-black/10">
            <p className="font-[family-name:var(--font-fragment-mono)] text-[12px] tracking-[-0.48px] mb-2">When:</p>
            <p className="text-[16px] leading-[1.4]">may 11th 11am-6pm</p>
          </div>
          {/* Where */}
          <div className="py-6 border-t border-black/10 border-b">
            <p className="font-[family-name:var(--font-fragment-mono)] text-[12px] tracking-[-0.48px] mb-2">Where:</p>
            <p className="text-[16px] leading-[1.4]">123 Candyland Ln,<br />Portland, OR</p>
          </div>
        </section>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-[5px]">
          {/* Card 1 - Full image */}
          <div className="relative aspect-square rounded-[8px] overflow-hidden">
            <Image src="/images/grid-1.png" alt="Product" fill className="object-cover" />
          </div>

          {/* Card 2 - Dark bg + product */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#252525] p-[13px] flex flex-col justify-between">
            <div className="relative flex-1 rounded-[4px] overflow-hidden">
              <Image src="/images/grid-2.png" alt="T-Shirt" fill className="object-cover" />
            </div>
            <div className="flex justify-between mt-3 font-[family-name:var(--font-fragment-mono)] text-[12px] text-white tracking-[-0.48px]">
              <span>T-Shirt</span>
              <span>Spring 25&apos;</span>
            </div>
          </div>

          {/* Card 3 - Google Maps link */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-black p-[13px] flex flex-col justify-between">
            <div className="font-[family-name:var(--font-fragment-mono)] text-[12px] text-white tracking-[-0.48px]">
              Google Maps Link
            </div>
            <div className="self-end">
              <div className="w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center">
                <ArrowUpRight size={20} className="text-black" />
              </div>
            </div>
          </div>

          {/* Card 4 - Navy bg + product */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#1B234B] p-[13px] flex flex-col justify-between">
            <div className="relative flex-1 rounded-[4px] overflow-hidden">
              <Image src="/images/grid-4.png" alt="Totes" fill className="object-cover" />
            </div>
            <div className="flex justify-between mt-3 font-[family-name:var(--font-fragment-mono)] text-[12px] text-white tracking-[-0.48px]">
              <span>Totes</span>
              <span>Spring 25&apos;</span>
            </div>
          </div>

          {/* Card 5 - Clothing label */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#F1F1F1] p-[13px] flex items-end">
            <span className="text-[20px] font-medium">Clothing</span>
          </div>

          {/* Card 6 - Full image */}
          <div className="relative aspect-square rounded-[8px] overflow-hidden">
            <Image src="/images/grid-6.png" alt="Product" fill className="object-cover" />
          </div>

          {/* Card 7 - Zines label */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#F7EDDD] p-[13px] flex items-end">
            <span className="text-[20px] font-medium">Zines</span>
          </div>

          {/* Card 8 - Dark red bg + product */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#4F1212] p-[13px] flex flex-col justify-between">
            <div className="relative flex-1 rounded-[4px] overflow-hidden">
              <Image src="/images/grid-8.png" alt="Mixtapes" fill className="object-cover" />
            </div>
            <div className="flex justify-between mt-3 font-[family-name:var(--font-fragment-mono)] text-[12px] text-white tracking-[-0.48px]">
              <span>Mixtapes</span>
              <span>Spring 25&apos;</span>
            </div>
          </div>

          {/* Card 9 - Live Music label */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#969F7D] p-[13px] flex items-end">
            <span className="text-[20px] font-medium">Live Music</span>
          </div>

          {/* Card 10 - Substack link */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-black p-[13px] flex flex-col justify-between">
            <div className="font-[family-name:var(--font-fragment-mono)] text-[12px] text-white tracking-[-0.48px]">
              Follow Us on Substack
            </div>
            <div className="self-end">
              <div className="w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center">
                <ArrowUpRight size={20} className="text-black" />
              </div>
            </div>
          </div>

          {/* Card 11 - Records label */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#D3C7B9] p-[13px] flex items-end">
            <span className="text-[20px] font-medium">Records</span>
          </div>

          {/* Card 12 - Instagram link */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-black p-[13px] flex flex-col justify-between">
            <div className="font-[family-name:var(--font-fragment-mono)] text-[12px] text-white tracking-[-0.48px]">
              Browse the Instagram
            </div>
            <div className="self-end">
              <div className="w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center">
                <ArrowUpRight size={20} className="text-black" />
              </div>
            </div>
          </div>

          {/* Card 13 - Records label (beige) */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#F7EDDD] p-[13px] flex items-end">
            <span className="text-[20px] font-medium">Records</span>
          </div>

          {/* Card 14 - Pink bg + product */}
          <div className="aspect-square rounded-[8px] overflow-hidden bg-[#EEA6A6] p-[13px] flex flex-col justify-between">
            <div className="relative flex-1 rounded-[4px] overflow-hidden">
              <Image src="/images/grid-14.png" alt="Tees" fill className="object-cover" />
            </div>
            <div className="flex justify-between mt-3 font-[family-name:var(--font-fragment-mono)] text-[14px] text-black tracking-[-0.56px]">
              <span>Tees</span>
              <span>Spring 25&apos;</span>
            </div>
          </div>
        </div>

        {/* Quote */}
        <p className="text-[28px] leading-[1.3] tracking-[-1.12px] py-12">
          Nonsense is a rebellion against the ordinary. No trends, no seasons—just wearable statements.
        </p>
      </main>

      {/* Footer */}
      <footer className="px-[40px] pb-10">
        {/* Newsletter */}
        <div className="flex items-center justify-between py-6 border-t border-black/10">
          <span className="text-[16px]">Sign Up for our Newsletter</span>
          <div className="w-[40px] h-[40px] bg-white border border-black/10 rounded-full flex items-center justify-center">
            <ArrowUpRight size={16} className="text-black" />
          </div>
        </div>

        {/* CTA Image */}
        <div className="relative w-full aspect-[295/188] rounded-[8px] overflow-hidden my-6">
          <Image src="/images/footer-cta.png" alt="CTA" fill className="object-cover" />
        </div>

        {/* Footer Content */}
        <div className="mt-8">
          <p className="text-[16px] mb-2">A Wearable Statements Pop Up</p>
          <h2 className="text-[46px] font-normal leading-[1.1] tracking-[-1.84px] mb-8">Nonsense</h2>
          <div className="border-t border-black/10 pt-4 space-y-1">
            <p className="text-[13px] text-black/60">Nonsense&copy; 2025 All Rights Reserved</p>
            <p className="text-[13px] text-black/60">@nonsenseFashion</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
