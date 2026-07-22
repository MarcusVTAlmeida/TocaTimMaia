import { env } from '../config/env';
import {
  textoBio,
  textoCuriosidades,
  textoFrases,
  textoDiscografiaPrincipal
} from './textoTim';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const MODELOS = [
  { id: 'openrouter/auto',                         timeout: 30000 },
  { id: 'openrouter/free',                         timeout: 30000 },
  { id: 'openrouter/owl-alpha',                    timeout: 30000 },
  { id: 'z-ai/glm-4.5-air:free',                   timeout: 40000 },
  { id: 'openai/gpt-oss-120b:free',                timeout: 40000 },
  { id: 'deepseek/deepseek-v4-flash:free',         timeout: 30000 },
];

function fetchComTimeout(url, opcoes, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opcoes, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function chamarModelo(modelo, prompt) {
  let response;
  try {
    response = await fetchComTimeout(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${env.openRouterApiKey}`,
        'HTTP-Referer': 'https://tocarock.com.br',
        'X-Title':      'Toca Tim Maia Quiz App',
      },
      body: JSON.stringify({
        model:       modelo.id,
        messages:    [{ role: 'user', content: prompt }],
      }),
    }, modelo.timeout);
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Timeout' : e.message;
    throw new Error(`[${modelo.id}] Falha na requisição: ${msg}`);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    const msg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`[${modelo.id}] API retornou erro: ${msg}`);
  }

  const raw = data?.choices?.[0]?.message?.content ?? '';
  if (!raw.trim()) {
    throw new Error(`[${modelo.id}] Resposta vazia`);
  }

  return raw;
}

function parsearResposta(raw, modeloId) {
  let jsonStr = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const inicio = jsonStr.indexOf('[');
  const fim    = jsonStr.lastIndexOf(']');

  if (inicio === -1 || fim <= inicio) {
    throw new Error(`[${modeloId}] Nenhum array JSON encontrado`);
  }

  jsonStr = jsonStr.substring(inicio, fim + 1);
  const perguntas = JSON.parse(jsonStr);

  if (!Array.isArray(perguntas) || perguntas.length === 0) {
    throw new Error(`[${modeloId}] Array vazio ou inválido`);
  }

  return perguntas;
}

function validarPerguntas(perguntas, modeloId) {
  const tiposComOpcoes = ['multipla','complete_letra','qual_nao_pertence','de_qual_musica','cronologia'];
  const validas = perguntas.filter(p => {
    if (!p?.pergunta || !p?.tipo || !p?.dificuldade) return false;
    if (p.tipo === 'verdadeiro_falso') return typeof p.resposta === 'boolean';
    if (tiposComOpcoes.includes(p.tipo)) {
      return Array.isArray(p.opcoes) && p.opcoes.length === 4 &&
             Number.isInteger(p.resposta) && p.resposta >= 0 && p.resposta <= 3;
    }
    return false;
  });

  if (validas.length === 0) {
    throw new Error(`[${modeloId}] Nenhuma pergunta válida após validação`);
  }

  console.log(`[${modeloId}] ${validas.length}/${perguntas.length} perguntas válidas`);
  return validas;
}

export async function gerarPerguntasGemini(texto, opcoes = {}) {
  const {
    perguntasEvitadas = [],
    dataReferencia    = new Date().toISOString().slice(0, 10),
    tentativa         = 1,
  } = opcoes;

  const perguntasProibidas = perguntasEvitadas
    .slice(0, 60)
    .map((p, i)  => `${i + 1}. ${p}`)
    .join('\n');

 const prompt = `
Você é um especialista em Tim Maia criando perguntas VARIADAS e SURPREENDENTES para um quiz.
Use SOMENTE as informações dos textos abaixo. NÃO invente dados. NÃO escreva nada fora do JSON.

Rodada: ${dataReferencia} / tentativa ${tentativa}.

═══════════════════════════════════════════
INSTRUÇÕES DE CONTEÚDO POR TIPO DE PERGUNTA
═══════════════════════════════════════════

Você tem acesso a 6 fontes de conteúdo. Use-as assim:

📖 BIOGRAFIA → use para: multipla, verdadeiro_falso
Explore:

nascimento na Tijuca
infância humilde e venda de marmitas
The Sputniks com Roberto Carlos
ida aos EUA e contato com a soul music
prisão e deportação
fase dos primeiros LPs
Cultura Racional
carreira independente
filhos, sobrinho Ed Motta
último show e morte
Exemplos de assunto:

“Por que Tim foi para os EUA?”
“Qual foi o apelido da infância?”
“Qual gravadora própria ele criou?”
🎭 CURIOSIDADES → use para: verdadeiro_falso, multipla
Explore:

apelido “Babulina”
ajuda de Frei Cassiano para viajar
apelido “Síndico”
destruição dos discos da fase Racional
temperamento forte e atrasos em shows
frase “eu minto um pouco”
candidatura a senador
Exemplos de assunto:

“Tim destruiu os discos da fase Racional?”
“Quem deu o apelido Síndico?”
“O que era o ‘triátlon’ do Tim?”
💬 FRASES → use para: complete_letra, verdadeiro_falso
Explore:

versos românticos
frases sobre amor e solidão
trechos de músicas famosas
falas marcantes e bem-humoradas
Exemplos de assunto:

“Não quero dinheiro, eu só quero _”
“Só vivemos quando _”
“Azul da cor do _”
🎵 ESTILO MUSICAL → use para: cronologia, qual_nao_pertence, multipla
Explore:

soul, funk, samba e MPB
voz grave e intensa
Fender Rhodes
sax, trompete e baixo
influência da música negra americana
Exemplos de assunto:

“Qual instrumento combina mais com Tim Maia?”
“Qual gênero faz parte do som dele?”
“Que estilo ele ajudou a popularizar no Brasil?”
📀 DISCOGRAFIA → use para: cronologia, multipla
Explore:

primeiro LP: Tim Maia (1970)
Tim Maia Volume II, III e IV
fase Racional (1975)
O Descobridor dos Sete Mares
lançamentos independentes
sucessos dos anos 80 e 90
Exemplos de assunto:

“Em que ano saiu o álbum Tim Maia?”
“Qual disco pertence à fase Racional?”
“Qual música é de tal álbum?”
🎬 LEGADO → use para: verdadeiro_falso, multipla
Explore:

último show em Niterói
morte em 1998
filme biográfico
musical e homenagens
influência em Ed Motta, Léo Maia, Seu Jorge e outros
Exemplos de assunto:

“O filme Tim Maia saiu em que ano?”
“Quem é parente musical de Tim Maia?”
“Onde foi o último show?”

═══════════════════════════════════════
DISTRIBUIÇÃO OBRIGATÓRIA DAS 6 PERGUNTAS
═══════════════════════════════════════

Gere EXATAMENTE 6 perguntas, UMA de cada tipo:

1. "multipla"          — 4 opções, "resposta": índice 0-3
   → Prefira parceiros, gravadoras, fatos biográficos inusitados ou faixas específicas

2. "verdadeiro_falso"  — sem "opcoes", "resposta": true ou false
   → Use curiosidades ou fatos biográficos — misture verdades e mentiras convincentes
   → Exemplo falso convincente: "Tim Maia chegou a conhecer pessoalmente John Lennon"

3. "complete_letra"    — trecho de FRASE ou LETRA com ___, 4 opções, "resposta": índice 0-3
   → Pode usar frases filosóficas de Tim Maia, não só letras de músicas

4. "qual_nao_pertence" — 3 faixas do mesmo álbum + 1 intrusa, "resposta": índice do intruso
   → Use faixas MENOS conhecidas para dificultar, não só os hits

5. "de_qual_musica"    — verso curto, 4 títulos como opções, "resposta": índice 0-3
   → Use versos de músicas menos famosas (Abre-te Sésamo, A Pedra do Gênesis, etc.)

6. "cronologia"        — pode ser:
   a) "Qual álbum foi lançado DEPOIS de X?" 4 opções
   b) "Qual foi o N-ésimo álbum de Tim Maia?" 4 opções
   c) "Qual gravadora publicou X?" (varia para não repetir sempre cronologia pura)

════════════════
DIFICULDADES
════════════════
- 2 perguntas "facil"   → biografia básica, hits conhecidos, fatos marcantes
- 2 perguntas "medio"   → parceiros, gravadoras, álbuns específicos, curiosidades
- 2 perguntas "dificil" → faixas obscuras, discografia póstuma, detalhes biográficos raros

${perguntasProibidas ? `\n════════════════\nEVITE ESTAS PERGUNTAS JÁ USADAS:\n════════════════\n${perguntasProibidas}` : ''}

Responda APENAS com o array JSON, sem texto antes ou depois:
[{"tipo":"...","dificuldade":"...","pergunta":"...","opcoes":[...],"resposta":0}, ...]

--- INÍCIO DOS TEXTOS BASE ---

## BIOGRAFIA
${textoBio}

## CURIOSIDADES
${textoCuriosidades}

## FRASES E PENSAMENTOS
${textoFrases}

## DISCOGRAFIA PRINCIPAL
${textoDiscografiaPrincipal}

--- FIM DOS TEXTOS BASE ---`.trim();

  const erros = [];

  for (const modelo of MODELOS) {
    try {
      console.log(`🤖 Tentando: ${modelo.id}`);

      const raw       = await chamarModelo(modelo, prompt);
      const perguntas = parsearResposta(raw, modelo.id);
      const validas   = validarPerguntas(perguntas, modelo.id);

      console.log(`✅ Sucesso: ${modelo.id} (${validas.length} perguntas)`);
      return validas;

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`⚠️ Falhou [${modelo.id}]: ${msg}`);
      erros.push(`${modelo.id}: ${msg}`);

      const delay = 500 * erros.length;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error(`Todos os modelos falharam:\n${erros.join('\n')}`);
}
