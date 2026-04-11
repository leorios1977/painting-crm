/**
 * SocialMediaBar — reads enabled social links from settings and renders
 * clickable icons with a "Follow Us" label. Only shows enabled platforms
 * with valid URLs/numbers. Embeddable in the public website footer and
 * customer portal.
 */
import { trpc } from "@/lib/trpc";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  Music,
} from "lucide-react";

interface SocialLink {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SocialMediaBarProps {
  /** Override label. Defaults to "Follow Us". */
  label?: string;
  /** Additional CSS class names for the wrapper div. */
  className?: string;
}

export function SocialMediaBar({ label = "Follow Us", className = "" }: SocialMediaBarProps) {
  const { data: branding } = trpc.settings.getBranding.useQuery();
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    retry: false,
  });

  // If social media is disabled globally, render nothing
  if (!settings || !settings.socialMediaEnabled) return null;

  const links: SocialLink[] = [];

  if (settings.facebookEnabled && settings.facebookUrl) {
    links.push({
      key: "facebook",
      label: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      href: settings.facebookUrl,
    });
  }
  if (settings.instagramEnabled && settings.instagramUrl) {
    links.push({
      key: "instagram",
      label: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      href: settings.instagramUrl,
    });
  }
  if (settings.whatsappEnabled && settings.whatsappNumber) {
    const num = settings.whatsappNumber.replace(/\D/g, "");
    links.push({
      key: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle className="h-5 w-5" />,
      href: `https://wa.me/${num}`,
    });
  }
  if (settings.twitterEnabled && settings.twitterUrl) {
    links.push({
      key: "twitter",
      label: "X / Twitter",
      icon: <Twitter className="h-5 w-5" />,
      href: settings.twitterUrl,
    });
  }
  if (settings.youtubeEnabled && settings.youtubeUrl) {
    links.push({
      key: "youtube",
      label: "YouTube",
      icon: <Youtube className="h-5 w-5" />,
      href: settings.youtubeUrl,
    });
  }
  if (settings.tiktokEnabled && settings.tiktokUrl) {
    links.push({
      key: "tiktok",
      label: "TikTok",
      icon: <Music className="h-5 w-5" />,
      href: settings.tiktokUrl,
    });
  }
  if (settings.linkedinEnabled && settings.linkedinUrl) {
    links.push({
      key: "linkedin",
      label: "LinkedIn",
      icon: <Linkedin className="h-5 w-5" />,
      href: settings.linkedinUrl,
    });
  }

  if (links.length === 0) return null;

  const primaryColor = (branding as { primaryColor?: string } | undefined)?.primaryColor ?? "#1e3a5f";

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {links.map((link) => (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
            className="flex items-center justify-center h-10 w-10 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ color: primaryColor }}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
  );
}

export default SocialMediaBar;
