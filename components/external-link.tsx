import { Href, Link } from 'expo-router';
import { type ComponentProps } from 'react';
import * as WebBrowser from 'expo-web-browser';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          try {
            // Prevent the default behavior of linking to the default browser on native.
            event.preventDefault();
            // Open the link in an in-app browser.
            if (WebBrowser.openBrowserAsync) {
              await WebBrowser.openBrowserAsync(href);
            }
          } catch (error) {
            console.log('Failed to open browser:', error);
          }
        }
      }}
    />
  );
}

