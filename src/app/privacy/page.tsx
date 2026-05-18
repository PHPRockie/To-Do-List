import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — FlowTask',
}

export default function PrivacyPage() {
  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Privacy Policy</h1>
        <p className="text-sm text-white/40 mt-1">Last updated: May 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white/70">What we store</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          Your tasks, settings, and preferences are stored locally in your browser using
          IndexedDB. This data never leaves your device unless you choose to enable cloud sync.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white/70">Optional cloud sync</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          If you sign in with your email, your tasks are synced to Supabase — a secure cloud
          database. Signing in is completely optional. All features work without an account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white/70">AI features</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          AI features are powered by Anthropic's Claude API. When you use AI features, the
          content of your tasks is sent to Anthropic's servers to generate responses. No
          other personal data is included. Anthropic's privacy policy applies to this data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white/70">Analytics</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          FlowTask does not collect analytics, track usage, show ads, or sell any data to
          third parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-white/70">Contact</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          For privacy questions:{' '}
          <a
            href="mailto:pppp112089@gmail.com"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            pppp112089@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
