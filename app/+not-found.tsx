import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Code } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Code size={48} color="#475569" strokeWidth={1.5} />
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0F172A',
    gap: 12,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  link: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
});
