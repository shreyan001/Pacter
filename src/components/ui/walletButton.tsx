export default function ConnectButton() {
    return (
      <div className="wallet-button-container">
        <w3m-button />
        <style jsx global>{`
          w3m-button {
            --w3m-border-radius-master: 12px !important;
            --w3m-accent: #3b82f6 !important;
            --w3m-color-mix: #3b82f6 !important;
            border-radius: 12px !important;
          }
          
          w3m-button::part(button) {
            border-radius: 12px !important;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
            border: none !important;
            padding: 12px 24px !important;
            font-weight: 600 !important;
            transition: all 0.2s ease !important;
          }
          
          w3m-button::part(button):hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
          }
        `}</style>
      </div>
    );
  }