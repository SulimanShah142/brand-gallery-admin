import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// This manually forces the router to look at the local ./app folder
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
