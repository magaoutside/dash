import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

interface TonConnectProviderProps {
  children: ReactNode;
}

export default function TonConnectProvider({ children }: TonConnectProviderProps) {
  return (
    <TonConnectUIProvider
      manifestUrl="https://dashgames.mocha.app/tonconnect-manifest.json"
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: "tonkeeper",
            name: "Tonkeeper",
            imageUrl: "https://tonkeeper.com/assets/tonconnect-icon.png",
            aboutUrl: "https://tonkeeper.com",
            universalLink: "https://app.tonkeeper.com/ton-connect",
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["ios", "android", "chrome", "firefox"]
          },
          {
            appName: "openmask",
            name: "OpenMask",
            imageUrl: "https://raw.githubusercontent.com/OpenProduct/openmask-extension/main/public/OpenMask_Logo_Icon.png",
            aboutUrl: "https://www.openmask.app/",
            universalLink: "https://www.openmask.app/",
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["chrome"]
          },
          {
            appName: "mytonwallet",
            name: "MyTonWallet",
            imageUrl: "https://static.mytonwallet.io/icon-256.png",
            aboutUrl: "https://mytonwallet.io",
            universalLink: "https://connect.mytonwallet.org",
            bridgeUrl: "https://bridge.mytonwallet.org/bridge/",
            platforms: ["ios", "android", "chrome", "firefox", "safari"]
          },
          {
            appName: "tonhub",
            name: "Tonhub",
            imageUrl: "https://tonhub.com/tonconnect_logo.png",
            aboutUrl: "https://tonhub.com",
            universalLink: "https://tonhub.com/ton-connect",
            bridgeUrl: "https://connect.tonhubapi.com/tonconnect",
            platforms: ["ios", "android"]
          }
        ]
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
