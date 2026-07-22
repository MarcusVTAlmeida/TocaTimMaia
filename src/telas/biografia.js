import React from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Avatar } from 'react-native-elements';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PARAGRAFOS = [`
  Tim Maia (1942-1998) foi um cantor e compositor brasileiro que fez sucesso com canções que representam o melhor do pop nacional, entre elas, “Azul da Cor do Mar”, “Primavera”, “Me dê Motivo”, “Não Quero Dinheiro, Só Quero Amar”, “Gostava Tanto de Você” e “Sossego”.

Tim Maia, nome artístico de Sebastião Rodrigues Maia, nasceu no Rio de Janeiro, no bairro da Tijuca, no dia 28 de setembro de 1942. Caçula de doze irmãos, quando criança, ajudava a família entregando marmitas. Com oito anos cantava no coral da Igreja. Em 1957 criou o grupo “The Sputniks”, formado por Roberto Carlos e outros cantores.

Em 1959, foi tentar a sorte nos Estados Unidos. Ficou hospedado, em Tarrytows, na casa de uma família que conhecera no Brasil. A cidade, a 40 km de Nova York, tinha pouco mais de 11 mil habitantes e abrigava a efervescência do jazz e da música negra. Nessa sua turnê americana, Sebastião era chamado de “Jim”, porque os americanos não conseguiam pronunciar “Tião”, seu apelido da juventude.

No início, integrou uma banda de Twist, depois foi convidado pelo músico americano Roger Bruno, para se juntar ao “Ideals”. Tim ficou responsável pela harmonia e pela guitarra. A banda lançou um único disco, com as músicas “New Love” (parceria de Tim com Roger) e Go Ahead and Cry.

Rebelde, Tim Maia passou a praticar pequenas transgressões: pulava a catraca do trem e furtava comida no supermercado. No fim de 1963, foi preso por roubo e porte de droga. Passou seis meses na prisão e em 1964 foi deportado do país.

De volta ao Brasil, Tim Maia conjugou tudo o que aprendeu da música negra americana, com ritmos brasileiros como samba e baião. Produziu o disco “A Onda é o Boogaloo” de Eduardo Araújo. Teve composições gravadas por Roberto Carlos (Não Vou Ficar) e Erasmo Carlos (Não Quero Nem Saber). Começou a se apresentar em programas de rádio e TV.

Em 1970 gravou seu primeiro LP, “Tim Maia”, que fez sucesso com as músicas “Azul da Cor do Mar”, “Coronel Antônio Bento”, “Primavera” e “Eu Amo Você”. Em 1971, lançou “Tim Maia”, que fez sucesso com “Não Quero Dinheiro, Só Quero Amar”, uma canção dançante de sua autoria, “Não Vou Ficar” e “Preciso Aprender a Ser Só”. Em 1975, lançou “Rational Culture”, que fez parte da fase mística do cantor, quando ele se filiou à seita, Universo em Desencanto.

Com histórico de atritos com as gravadoras, foi um dos primeiros artistas a lançar seu próprio selo “Seroma”, que depois virou a gravadora “Vitória Régia”. Com ela lançou “Que Beleza”, “Descobridor dos Sete Mares”, “Me Dê Motivo” etc.

Com seu comportamento polêmico, Tim faltava aos shows e entrevistas e se queixava do sistema de som dos locais em que se apresentava. Os pedidos de “mais grave, mais agudo, mais retorno” viraram rotina, pois ele repetia em todas as apresentações.

Envolvido com álcool e drogas, vivia com a saúde debilitada. Durante uma apresentação, no dia 8 de março de 1998, no Teatro Municipal de Niterói, passando mal, retirou-se do palco e foi levado para o hospital.

Tim Maia faleceu em Niterói, no Rio de Janeiro, no dia 15 de março de 1998, com infecção generalizada.
`];

const ehCitacao = (texto) => texto.trim().startsWith('"');

export default class Biografia extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          { }
          <View style={styles.hero}>
            <View style={styles.avatarShadow}>
              <Avatar
                size={170}
                rounded
                source={require('../../assets/images.png')}

              />
            </View>
            <Text style={styles.heroNome}>Tim Maia</Text>
            <Text style={styles.heroDatas}>28 set 1942 · Rio de Janeiro — 08 mar 1998 · Rio de Janeiro</Text>

            { }
            <View style={styles.heroDivider} />

            { }
            <View style={styles.chipsRow}>
              {['Síndico', 'Soul Brasileiro', 'Rei do Baile', 'Gênio da Música'].map((tag) => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          { }
          <View style={styles.corpo}>
            {PARAGRAFOS.map((texto, i) =>
              ehCitacao(texto) ? (
                <View key={i} style={styles.citacaoBloco}>
                  <View style={styles.citacaoBarra} />
                  <Text style={styles.citacaoTexto}>{texto}</Text>
                </View>
              ) : (
                <Text key={i} style={styles.paragrafo}>
                  {texto}
                </Text>
              )
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
}

const GOLD = '#C9A84C';
const BG = '#0a0a0a';
const CARD = '#141414';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  hero: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  avatarShadow: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderRadius: 60,
    marginBottom: 16,
  },
  heroNome: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroDatas: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  heroDivider: {
    width: 48,
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginVertical: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#1a1a1a',
  },
  chipText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  corpo: {
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  paragrafo: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'justify',
    marginBottom: 18,
  },

  citacaoBloco: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  citacaoBarra: {
    width: 3,
    backgroundColor: GOLD,
    borderRadius: 2,
  },
  citacaoTexto: {
    flex: 1,
    color: GOLD,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 24,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  assinaturaContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  assinaturaDivider: {
    width: 40,
    height: 1,
    backgroundColor: '#2a2a2a',
    marginBottom: 14,
  },
  assinatura: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  assinaturaSubtitulo: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 1,
  },
});
