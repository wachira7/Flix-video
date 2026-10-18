// app/(marketing)/privacy/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy · FlixVideo",
  description: "What FlixVideo collects, why, who helps us run the service, and how to download or delete your data.",
}

const settings = (label: string, href: string) => (
  <Link href={href} className="text-foreground underline underline-offset-4 hover:text-primary">
    {label}
  </Link>
)

const sections: LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>We only collect what we need to run FlixVideo:</p>
        <ul>
          <li>
            <strong>Your account:</strong> your email address and password, which we store as a one-way hash we can&apos;t read. If you
            sign in with Google, we receive your name, email and profile picture from Google.
          </li>
          <li>
            <strong>Your profile:</strong> anything you choose to add, such as a name, username, bio, photo, country or city. All of
            it is optional.
          </li>
          <li>
            <strong>Your activity:</strong> your watchlist, favourites, lists, ratings and reviews, which trailers you&apos;ve watched
            and how far, and your watch parties and their chat.
          </li>
          <li>
            <strong>Your AI conversations:</strong> the messages you send FlixVideo AI and its replies.
          </li>
          <li>
            <strong>Payments:</strong> the plan, amount, date and status of each payment. For M-Pesa we also keep your phone number
            and the M-Pesa receipt number. We never see your M-Pesa PIN or your card number.
          </li>
          <li>
            <strong>Devices:</strong> when you sign in, we record the browser and device type, IP address and time. This lets you
            see and sign out your devices in Settings.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <ul>
        <li>To run your account and keep it secure, for example to spot sign-ins you don&apos;t recognise.</li>
        <li>To recommend titles. Your watchlist, ratings and history shape your picks.</li>
        <li>To take payments and turn on the plan you paid for.</li>
        <li>
          To send emails you&apos;ve asked for, such as receipts and watch party invites. You can turn off the optional ones in{" "}
          {settings("Settings › Notifications", "/settings/notifications")}.
        </li>
        <li>To keep FlixVideo safe, for example by removing spam or abusive reviews.</li>
      </ul>
    ),
  },
  {
    id: "not",
    title: "What we don't do",
    body: (
      <ul>
        <li>We don&apos;t sell your personal data, and we don&apos;t share it with advertisers.</li>
        <li>
          We don&apos;t use advertising trackers. Trailers play through YouTube, which may set its own cookies when a trailer
          plays.
        </li>
        <li>We don&apos;t show your watch history or AI chats to other users.</li>
      </ul>
    ),
  },
  {
    id: "who-helps",
    title: "Who helps us run FlixVideo",
    body: (
      <>
        <p>
          We use these providers to run the service. Each one only gets the data it needs for its part, and some of them store
          data outside Kenya, including in the United States and the European Union.
        </p>
        <ul>
          <li>
            <strong>Hosting and storage:</strong> Vercel runs the website, Render runs our servers, and our data is kept with
            cloud database providers, including MongoDB and Redis. Profile photos are stored on Amazon Web Services.
          </li>
          <li>
            <strong>Payments:</strong> Safaricom (M-Pesa), Stripe (cards) and NOWPayments (crypto) process your payments.
          </li>
          <li>
            <strong>AI:</strong> the messages you send FlixVideo AI are passed to Anthropic (Claude) or OpenAI to write the reply.
            Please don&apos;t put sensitive personal details in your chats.
          </li>
          <li>
            <strong>Email:</strong> Resend delivers our emails.
          </li>
          <li>
            <strong>Sign-in:</strong> Google, if you choose to sign in with Google.
          </li>
          <li>
            <strong>Film and TV information:</strong> TMDB supplies titles, posters and where-to-watch data. We don&apos;t send
            TMDB any personal data.
          </li>
        </ul>
        <p>We may also share data when the law requires it, for example in response to a valid court order.</p>
      </>
    ),
  },
  {
    id: "your-controls",
    title: "Your controls",
    body: (
      <>
        <p>You can do all of this yourself, at any time:</p>
        <ul>
          <li>Edit or clear your profile on {settings("your profile", "/profile")}.</li>
          <li>Turn off watch history in {settings("Settings › Privacy", "/settings/privacy")}.</li>
          <li>
            Download a copy of everything we store about you, from {settings("Settings › Privacy", "/settings/privacy")}.
          </li>
          <li>
            See every device that&apos;s signed in, and sign any of them out, in {settings("Settings › Devices", "/settings/devices")}.
          </li>
          <li>Delete your AI conversations from the history list in Ask AI.</li>
          <li>
            Delete your account in {settings("Settings › Privacy", "/settings/privacy")}.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "keeping",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep your data while you have an account. When you delete your account, we erase your profile, activity, lists,
          reviews and AI conversations, and remove your email address.
        </p>
        <p>
          We keep payment records for as long as tax and accounting law requires, but they&apos;re no longer linked to your name
          or email.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Under Kenya&apos;s Data Protection Act, 2019, you have the right to be told how your data is used, and to access,
          correct or delete it. You can also object to how it&apos;s used, and ask for a copy you can take elsewhere. Most of
          this is in Settings, and for anything else, email{" "}
          <a href="mailto:support@flixvideo.com" className="text-foreground underline underline-offset-4 hover:text-primary">
            support@flixvideo.com
          </a>
          .
        </p>
        <p>
          If you&apos;re unhappy with how we handle your data, you can complain to the Office of the Data Protection Commissioner
          (odpc.go.ke).
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Passwords are hashed, connections are encrypted, and each signed-in device has its own session that you can end. No
        system is perfectly secure. If we ever have a breach that puts your data at risk, we&apos;ll tell you and the Data
        Protection Commissioner as the law requires.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        FlixVideo is for people aged 18 and over. Younger viewers need a parent or guardian to set up and look after the account.
        If you think a child has given us their data without permission, contact us and we&apos;ll delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy in a way that matters, we&apos;ll email you or show a notice in the app before the change
        applies. The date at the top always shows when it was last updated.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title={
        <>
          Your data, <em className="italic text-primary">plainly.</em>
        </>
      }
      intro={
        <p>
          What FlixVideo collects, why we need it, who helps us run the service, and how to download or delete it. Written to be
          read, not skimmed past.
        </p>
      }
      updated="17 October 2026"
      sections={sections}
    />
  )
}
