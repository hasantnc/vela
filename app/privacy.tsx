import { ScrollView, View, Text } from "react-native";
import { Stack } from "expo-router";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ color: "#A78BFA", fontSize: 13, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
      {title}
    </Text>
    {children}
  </View>
);

const P = ({ children }: { children: string }) => (
  <Text style={{ color: "#aaa", fontSize: 14, lineHeight: 22, marginBottom: 8 }}>
    {children}
  </Text>
);

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Gizlilik Politikası", headerBackTitle: "Geri" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#06060F" }}
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      >
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 }}>
          Gizlilik Politikası
        </Text>
        <Text style={{ color: "#444", fontSize: 12, marginBottom: 32 }}>
          Son güncelleme: Nisan 2026
        </Text>

        <Section title="1. Genel Bilgi">
          <P>VELA uygulaması ("biz", "uygulama"), kullanıcıların finansal verilerini güvenli biçimde yönetmelerine yardımcı olan bir kişisel finans takip uygulamasıdır.</P>
          <P>Bu gizlilik politikası, VELA uygulamasını kullandığınızda hangi verilerin toplandığını, nasıl kullanıldığını ve korunduğunu açıklamaktadır.</P>
        </Section>

        <Section title="2. Toplanan Veriler">
          <P>• E-posta adresi ve şifre (hesap oluşturma için)</P>
          <P>• Gelir ve gider işlem kayıtları (yalnızca siz girersiniz)</P>
          <P>• Finansal hedefler ve bütçe limitleri</P>
          <P>• Uygulama tercihler (para birimi, bildirim ayarları)</P>
          <P>• SMS verileri (Android'de isteğe bağlı, yalnızca finansal içerikli SMS'ler işlenir, cihazda kalır)</P>
        </Section>

        <Section title="3. Verilerin Kullanımı">
          <P>Toplanan veriler yalnızca şu amaçlarla kullanılır:</P>
          <P>• Uygulamanın temel işlevlerini sağlamak</P>
          <P>• AI destekli harcama analizi ve öneriler sunmak</P>
          <P>• Bildirim ve hatırlatıcı göndermek</P>
          <P>• Uygulama deneyimini kişiselleştirmek</P>
          <P>Verileriniz üçüncü taraflarla satılmaz veya paylaşılmaz.</P>
        </Section>

        <Section title="4. Üçüncü Taraf Hizmetler">
          <P>Uygulama aşağıdaki üçüncü taraf hizmetleri kullanmaktadır:</P>
          <P>• Google Firebase: Kimlik doğrulama ve veri depolama</P>
          <P>• OpenAI: AI destekli harcama analizi (anonim veri gönderilir)</P>
          <P>• Google OAuth: Sosyal giriş (isteğe bağlı)</P>
          <P>Bu hizmetlerin kendi gizlilik politikaları mevcuttur.</P>
        </Section>

        <Section title="5. Veri Güvenliği">
          <P>Verileriniz Firebase Firestore'da şifrelenmiş olarak saklanır. Yalnızca kimliği doğrulanmış kullanıcılar kendi verilerine erişebilir.</P>
          <P>SMS verileri hiçbir zaman sunucularımıza gönderilmez; yalnızca cihazınızda işlenir.</P>
        </Section>

        <Section title="6. Veri Saklama ve Silme">
          <P>Hesabınızı silmek istediğinizde tüm verileriniz Firebase'den kalıcı olarak silinir.</P>
          <P>Hesap silme talebi için: vela@hasantncc.com adresine e-posta gönderebilirsiniz.</P>
        </Section>

        <Section title="7. Çocukların Gizliliği">
          <P>VELA uygulaması 13 yaşın altındaki çocuklara yönelik değildir ve bu yaş grubundan bilerek veri toplamaz.</P>
        </Section>

        <Section title="8. Değişiklikler">
          <P>Bu politika zaman zaman güncellenebilir. Önemli değişiklikler uygulama içinde bildirilir.</P>
        </Section>

        <Section title="9. İletişim">
          <P>Gizlilik ile ilgili sorularınız için:</P>
          <P>E-posta: vela@hasantncc.com</P>
        </Section>

        <Text style={{ color: "#333", fontSize: 11, textAlign: "center", marginTop: 16 }}>
          © 2026 VELA. Tüm hakları saklıdır.
        </Text>
      </ScrollView>
    </>
  );
}
