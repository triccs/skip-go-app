import { Widget } from "@skip-go/widget";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/ui";

/**
 * SwapPage — Widget-based swap page for liquidated/claimed assets.
 *
 * - Source restricted to Osmosis (where claimed collateral lands)
 * - Only shows assets the user holds on connected wallets
 * - Destination pre-filled to USDC on Osmosis (changeable)
 */
export function SwapPage() {
  const theme = useTheme();

  if (!theme) return null;

  return (
    <div
      className={cn(
        "bg-[#191919] font-sans subpixel-antialiased",
        "relative overflow-x-hidden overflow-y-hidden",
        "before:fixed before:inset-x-0 before:bottom-0 before:h-[100vh] before:content-['']",
        "before:bg-cover before:bg-[center_top] before:bg-no-repeat",
        theme === "dark" ? "before:bg-[url(/dark-bg.svg)]" : theme === "light" ? "before:bg-[url(/light-bg.svg)]" : "",
      )}
    >
      <main className="relative flex min-h-screen flex-col">
        <div className="flex flex-grow flex-col items-center justify-center">
          <div className="widget-container">
            <img
              src="/membrane-logo.svg"
              alt="Membrane"
              className="mx-auto mb-4 h-[36px]"
            />
            <Widget
              theme={theme}
              brandColor="#22d3ee"
              apiUrl="https://api.skip.build"
              disableShadowDom
              defaultRoute={{
                srcChainId: "osmosis-1",
                destChainId: "osmosis-1",
                destAssetDenom:
                  "ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4",
              }}
              routeConfig={{
                experimentalFeatures: ["hyperlane", "stargate", "eureka", "layer_zero"],
              }}
              settings={{
                useUnlimitedApproval: true,
              }}
              filter={{
                source: {
                  "osmosis-1": undefined,
                },
              }}
              hideAssetsUnlessWalletTypeConnected={true}
              onlyTestnet={process.env.NEXT_PUBLIC_IS_TESTNET}
            />
          </div>
        </div>

        <div className="hidden w-full flex-row items-center justify-center px-8 py-6 md:flex">
          <p className={`text-center text-[13px] opacity-50 ${theme === "dark" ? "text-white" : "text-black"}`}>
            Powered by Skip:Go
          </p>
        </div>
      </main>
    </div>
  );
}
