import { Tabs, useRouter, useSegments } from 'expo-router';
import {
    BarChart3,
    ChevronRight,
    Grid3x3,
    Home,
    Wallet as WalletIcon,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import AvatarPicker from '../../components/AvatarPicker';
import { colors, FONT_FAMILY_SEMIBOLD, spacing } from '../../theme/theme';

export default function TabsLayout() {
    function HeaderBack() {
        const router = useRouter();
        const segments = useSegments();
        if (!segments || segments.length <= 1) return null;
        return (
            <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingHorizontal: 8 }}
                accessibilityLabel="Back"
            >
                <ChevronRight color={colors.onPrimary} size={22} />
            </TouchableOpacity>
        );
    }
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                // headerRight: () => <HeaderBack />,
                headerRight: () => <AvatarPicker />,
                headerStyle: {
                    backgroundColor: colors.primary,
                    borderBottomWidth: 0,
                    height: 90,
                },
                headerLeftContainerStyle: {
                    paddingLeft: spacing.containerMargin,
                },
                headerRightContainerStyle: {
                    paddingRight: spacing.containerMargin,
                },
                headerTitleAlign: 'left',
                headerTitleStyle: {
                    color: colors.onPrimary,
                    fontFamily: FONT_FAMILY_SEMIBOLD,
                    fontSize: 20,
                },
                headerTintColor: colors.onPrimary,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: colors.surfaceContainerLowest,
                    borderTopColor: colors.outlineVariant,
                    height: 64,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'الرئيسية',
                    tabBarIcon: ({ color, size }) => (
                        <Home color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="wallets"
                options={{
                    title: 'المحافظ',
                    tabBarIcon: ({ color, size }) => (
                        <WalletIcon color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'المعاملات',
                    tabBarIcon: ({ color, size }) => (
                        <Grid3x3 color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    title: 'الإحصائيات',
                    tabBarIcon: ({ color, size }) => (
                        <BarChart3 color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
