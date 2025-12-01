import { Link } from '@tanstack/react-router'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Flow NFT</h3>
            <p className="text-sm text-muted-foreground">
              Mint, list, and trade NFTs on the Flow blockchain
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/marketplace"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  to="/my-nfts"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My NFTs
                </Link>
              </li>
            </ul>
          </div>

          {/* Create */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Create</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/mint"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mint NFT
                </Link>
              </li>
              <li>
                <Link
                  to="/mint/collection"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://flow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Flow Blockchain
                </a>
              </li>
              <li>
                <a
                  href="https://developers.flow.com/evm/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Flow EVM Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Flow NFT. Built on Flow EVM.</p>
        </div>
      </div>
    </footer>
  )
}
