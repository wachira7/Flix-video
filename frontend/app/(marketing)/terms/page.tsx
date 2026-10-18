// app/(marketing)/terms/page.tsx
import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Terms of Use · FlixVideo",
  description: "The rules for using FlixVideo: accounts, plans and payments, what you post, and our responsibilities.",
}

const sections: LegalSection[] = [
  {
    id: "service",
    title: "What FlixVideo is",
    body: (
      <>
        <p>
          FlixVideo is a guide to films and TV. It helps you find titles, explains its recommendations, plays trailers and shows
          where each title is available. We don&apos;t host or stream full films or episodes.
        </p>
        <p>
          When you follow a link to a streaming, rental or store service, that service&apos;s own terms and prices apply. We
          aren&apos;t responsible for what it offers, and availability can change without notice.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>You need to be 18 or over, or have a parent or guardian look after your account.</li>
        <li>Give us a real email address, and keep your password to yourself.</li>
        <li>
          You&apos;re responsible for what happens on your account. If you spot a device you don&apos;t recognise, sign it out in{" "}
          <Link href="/settings/devices" className="text-foreground underline underline-offset-4 hover:text-primary">
            Settings › Devices
          </Link>{" "}
          and change your password.
        </li>
        <li>You can delete your account at any time from Settings.</li>
      </ul>
    ),
  },
  {
    id: "plans",
    title: "Plans and payments",
    body: (
      <>
        <ul>
          <li>The Free plan is free, with no time limit and no card needed.</li>
          <li>
            Paid plans are priced in Kenya shillings, as shown on our pricing page when you pay. A payment covers 30 days from
            when it goes through. Paying again before then adds 30 days to the time you have left.
          </li>
          <li>
            Plans don&apos;t renew on their own. We won&apos;t charge you again unless you choose to pay. When your 30 days end,
            your account moves back to the Free plan and keeps your lists and history.
          </li>
          <li>Safaricom, Stripe or NOWPayments process the payment, and their terms apply to it as well.</li>
          <li>
            If you were charged in error, or a paid feature didn&apos;t work, email{" "}
            <a href="mailto:support@flixvideo.com" className="text-foreground underline underline-offset-4 hover:text-primary">
              support@flixvideo.com
            </a>{" "}
            within 14 days and we&apos;ll put it right.
          </li>
        </ul>
        <p>
          If we change a price, the new price applies only to payments you make after the change. It never affects time
          you&apos;ve already paid for.
        </p>
      </>
    ),
  },
  {
    id: "posting",
    title: "What you post",
    body: (
      <>
        <p>
          Your reviews, lists and watch party messages stay yours. By posting them, you allow us to show them on FlixVideo to the
          people you&apos;ve shared them with, or to everyone if they&apos;re public.
        </p>
        <p>Please don&apos;t post anything that:</p>
        <ul>
          <li>harasses, threatens or targets anyone, or attacks people for who they are</li>
          <li>is spam or advertising, or impersonates someone else</li>
          <li>shares other people&apos;s private information</li>
          <li>is illegal, or links to pirated copies of films or shows</li>
        </ul>
        <p>
          We may remove content that breaks these rules. For serious or repeated breaches, we may suspend or close the account.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "FlixVideo AI",
    body: (
      <p>
        FlixVideo AI&apos;s suggestions are written by a computer and can get details wrong, such as a year, a cast member or
        where a title is available. Check a title&apos;s page before you plan a night around it. FlixVideo AI is included with
        Premium, with up to 50 new conversations a month.
      </p>
    ),
  },
  {
    id: "fair-use",
    title: "Using FlixVideo fairly",
    body: (
      <p>
        Don&apos;t try to break into accounts or our systems, copy FlixVideo&apos;s data in bulk, or use bots to overload the
        service. We limit how often some features can be used, so that everyone gets a fast service.
      </p>
    ),
  },
  {
    id: "credits",
    title: "Film information and credits",
    body: (
      <>
        <p>
          Titles, images and where-to-watch information come from TMDB. This product uses the TMDB API but is not endorsed or
          certified by TMDB.
        </p>
        <p>Trailers are played from YouTube. Film titles, posters and trailers belong to their owners.</p>
      </>
    ),
  },
  {
    id: "responsibility",
    title: "Our responsibility",
    body: (
      <>
        <p>
          We work to keep FlixVideo running and accurate, but we can&apos;t promise it will always be available, error-free or
          that every listing is current. As far as the law allows, we&apos;re not liable for indirect losses from using it.
        </p>
        <p>
          If you&apos;re on a paid plan and something goes wrong on our side, the most we&apos;ll owe you is what you paid us in the
          last 30 days. Nothing in these terms limits rights you have under Kenyan consumer law.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Changes and the law",
    body: (
      <>
        <p>
          If we change these terms in a way that matters, we&apos;ll tell you by email or in the app before the change applies. If
          you keep using FlixVideo after that, the new terms apply.
        </p>
        <p>
          These terms are governed by the laws of Kenya. If there&apos;s a dispute, please email us first. Most problems can be
          solved quickly that way.
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of Use"
      title={
        <>
          The <em className="italic text-primary">house rules.</em>
        </>
      }
      intro={<p>What you can expect from us, what we ask of you, and how plans and payments work. In plain language.</p>}
      updated="17 October 2026"
      sections={sections}
    />
  )
}
