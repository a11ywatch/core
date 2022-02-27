import { config } from "@app/config";

interface MarketingFooterParams {
  userId: number;
  email?: string;
}

interface Footer {
  marketing(params: MarketingFooterParams): string;
}

const footer: Footer = {
  marketing: ({
    userId,
    email,
  }) => `<footer style="margin-top:30px; padding: 6px;">
<a href="${config.ROOT_URL}/api/unsubscribe-emails?id=${userId}&email=${email}" target="_blank" style="font-size:12px">Unsubscribe</a>
<div style="margin-top:30px; font-weight: 100; text-align: center;">Powered by A11yWatch, LLC</div>
</footer>`,
};

export { footer };
