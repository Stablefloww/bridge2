import { ChatContainer } from '@/components/chat/ChatContainer';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-h2 md:text-h1 font-bold text-text-primary dark:text-text-primary-dark">
          Natural Bridge
        </h1>
        <WalletConnectButton />
      </header>
      
      <div className="w-full max-w-4xl rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark shadow-sm overflow-hidden flex-1">
        <ChatContainer />
      </div>
      
      <footer className="w-full max-w-4xl mt-8 text-text-secondary dark:text-text-secondary-dark text-center text-xs">
        <p>Natural Language Cross-Chain Bridge for Base</p>
      </footer>
    </main>
  );
} 