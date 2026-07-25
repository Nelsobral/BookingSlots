import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Hero } from '@/components/public/hero'
import { Features } from '@/components/public/features'
import { Pricing } from '@/components/public/pricing'
import { Footer } from '@/components/public/footer'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Pricing />

        {/* CTA banner */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-r from-rose-600 to-purple-600 px-8 py-16 text-center shadow-xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to grow your business?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-rose-100">
                Join hundreds of beauty professionals who trust Booking Service
                to fill their calendars and reduce no-shows.
              </p>
              <div className="mt-8">
                <Link href="/signup">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-rose-700 hover:bg-rose-50"
                  >
                    Sign up free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
