import * as React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-elements';
import Admob from '../../admob'

export default class App extends React.Component {

  render() {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.avatarContainer}>
            <Avatar
              size='xlarge'
              rounded
              source={{ uri: 'https://res.cloudinary.com/dib0twra5/image/upload/v1736536387/Cazuza%20Dados/cazuza_acl2lp.png' }} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              Cazuza, nome artístico de Agenor de Miranda Araújo Neto, nasceu no Rio de Janeiro, em 4 de abril de 1958. Sua trajetória é marcada por uma mistura de talento inquestionável, ousadia artística e uma luta intensa contra a adversidade. O cantor e compositor brasileiro conquistou o Brasil e o mundo com sua poesia, seu rock irreverente e seu olhar único sobre a sociedade. Sua vida, curta e intensa, e sua obra continuam a impactar gerações, deixando um legado imortal.
              
              {'\n\n'}A Juventude e os Primeiros Passos na Música
              Cazuza nasceu em uma família de classe média alta. Seu pai, João Araújo, foi um executivo de destaque na gravadora Som Livre, e sua mãe, Lucinha Araújo, uma socialite que se tornou uma figura importante na vida do filho. Desde cedo, Cazuza mostrou interesse pela música, embora inicialmente tivesse aspirações literárias. Sua educação foi marcada por estudos em colégios tradicionais e também por experiências em ambientes culturais, como o teatro e a música.

              Aos 14 anos, Cazuza se envolveu com o movimento punk e com a música que começava a surgir na época, como o rock'n'roll, que iria definir sua carreira. Durante sua juventude, ele encontrou no rock uma maneira de expressar suas frustrações e sua rebeldia. Mas foi no início dos anos 1980 que ele realmente começaria a se destacar.

              {'\n\n'}Os Primeiros Sucessos e a Formação do Barão Vermelho
              O momento decisivo para sua carreira musical aconteceu em 1981, quando Cazuza se juntou à banda Barão Vermelho, formada por jovens talentos do Rio de Janeiro. O grupo, que mesclava rock com elementos do samba e da música brasileira, rapidamente se tornou um dos ícones da cena musical brasileira da época.

              Com Cazuza nos vocais, o Barão Vermelho lançou seu primeiro álbum em 1982. O disco não foi um grande sucesso comercial, mas as músicas tinham uma energia e uma força que começavam a chamar a atenção do público jovem. Cazuza se destacou como compositor e letrista, com suas letras cheias de crítica social, emoção e angústia. A canção "Pro Dia Nascer Feliz", de 1983, foi um marco da carreira do Barão Vermelho, se tornando um dos maiores hinos da música brasileira da década.

              {'\n\n'}Carreira Solo e a Revolução Musical
              O auge da carreira de Cazuza começou em 1985, quando ele decidiu seguir carreira solo. Seu primeiro álbum solo, Cazuza (1985), foi um sucesso imediato, tanto de público quanto de crítica. O disco trazia uma mistura de rock com influências da música brasileira, um som autêntico e inovador. O cantor abordava temas como amor, angústia, liberdade e, principalmente, a busca por identidade.

              Em 1987, Cazuza lançou Exagerado, talvez seu álbum mais emblemático, que trazia a música-título que se tornaria um de seus maiores hits. As letras de Cazuza falavam sobre a intensidade da vida, a efemeridade da juventude e a busca por algo mais profundo. "O Tempo Não Para", uma das músicas mais conhecidas do cantor, é uma verdadeira manifesto de sua visão de vida, um grito contra o conformismo e a rotina.

              A partir de então, Cazuza se consolidou como um dos maiores artistas do Brasil. Ele se destacava por sua presença de palco, seu carisma e sua postura ousada, tanto na música quanto na vida pessoal. Sua imagem de rebelde, unida à sua postura crítica e à sua sinceridade nas letras, conquistou uma legião de fãs que o viam como um representante da juventude e da liberdade.

              {'\n\n'}A Luta Contra a AIDS e a Morte Prematura
              No entanto, por trás do brilho e da fama, Cazuza estava enfrentando uma luta pessoal que, aos poucos, se tornaria pública. Em 1989, Cazuza revelou ao Brasil que estava vivendo com HIV, o vírus que causa a AIDS. Esse foi um momento que chocou o país e gerou uma imensa comoção entre seus fãs. Cazuza, entretanto, manteve sua postura irreverente e continuou a se apresentar, mas a doença foi lentamente minando sua saúde.

              Sua última turnê, O Poeta Está Vivo, realizada em 1989, foi uma das mais emocionantes e emblemáticas de sua carreira. Apesar da fragilidade de seu corpo, Cazuza continuou a se apresentar com a mesma energia e paixão de sempre. Suas letras, agora, ganhavam uma nova profundidade, com um toque de urgência e uma reflexão sobre a finitude da vida. Entre os fãs, havia uma sensação de que ele estava tentando deixar uma última mensagem, algo além da música.

              A doença de Cazuza avançava rapidamente e, em julho de 1990, ele faleceu, aos 32 anos, no Hospital de Câncer do Rio de Janeiro. Sua morte foi uma perda devastadora para o Brasil, e o luto tomou conta de milhares de fãs que viam nele o reflexo de uma geração. Cazuza morreu cedo, mas sua obra, seu legado e sua influência perduram até hoje.

              {'\n\n'}O Legado Musical e Cultural
              A morte de Cazuza não significou o fim de sua presença no cenário musical brasileiro. Pelo contrário, ele se tornou um ícone imortal. Sua música continua a ser celebrada em shows, filmes, peças e livros. Canções como "Codinome Beija-Flor", "Faz Parte do Meu Show", "O Tempo Não Para" e "Brasil" continuam sendo referência para artistas e ouvintes, e sua poesia permanece viva nas letras de novos compositores.

              Além disso, o impacto cultural de Cazuza vai muito além da música. Ele foi um dos principais expoentes de uma geração que vivia a transição do regime militar para a democracia, e suas letras refletiam a revolução social, política e comportamental que acontecia no Brasil. Sua atitude irreverente e sua luta contra o preconceito e a opressão fizeram dele uma figura importante na luta pelos direitos LGBT, especialmente no que diz respeito ao preconceito contra as pessoas vivendo com HIV/AIDS.

              Após sua morte, sua mãe, Lucinha Araújo, fundou a Sociedade Viva Cazuza, uma organização que oferece apoio a crianças e adolescentes vivendo com HIV/AIDS, como uma forma de perpetuar o legado de seu filho e ajudar as novas gerações a lidar com os desafios impostos pela doença.

              {'\n\n'}Conclusão
              A vida de Cazuza foi breve, mas intensa e cheia de significado. Seu trabalho atravessou gerações e continua a ser uma referência para a música brasileira, especialmente para o rock nacional. Sua capacidade de transformar suas experiências e angústias em letras que tocavam profundamente os ouvintes é algo que poucos artistas conseguiram alcançar. Cazuza não apenas cantou sobre a vida e a morte; ele viveu essas realidades com uma intensidade única e, ao fazer isso, eternizou sua imagem como um dos maiores poetas da música brasileira.

              Cazuza nos deixou um legado de coragem, de arte, de irreverência e de verdade. Ele nunca teve medo de ser quem era, e isso o tornou uma figura eterna na história da música do Brasil. Como ele mesmo disse em uma de suas músicas mais emblemáticas: "O tempo não para". E, assim, Cazuza permanece vivo, em cada nota de suas canções e na memória de todos que ainda cantam suas músicas com a mesma paixão que ele colocou em cada verso.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.adContainer}>
          <Admob />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingLeft: 20,
    paddingRight: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'black',
  },
  textContainer: {
    marginBottom: 20,
  },
  text: {
    color: 'white',
    textAlign: 'justify',
    lineHeight: 22,
  },
  adContainer: {
    bottom: 0,
  },
});
