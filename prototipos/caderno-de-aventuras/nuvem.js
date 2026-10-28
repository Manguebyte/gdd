// nuvem.js — conta do jogador (usuário e senha) e o save na nuvem (Firebase).
//
// POR QUE: o save fica no navegador, então trocar de aparelho (ou limpar o
// navegador) perdia a aventura. Com uma conta, o mesmo save sobe para a
// nuvem e desce em qualquer aparelho.
//
// ESTRATÉGIA: o save do navegador continua sendo o principal (o jogo joga
// sem internet); a nuvem é uma cópia. O login é por usuário e senha, sem
// e-mail: o Firebase Auth só conhece e-mail, então o usuário vira um e-mail
// interno (fulano@USER_DOMAIN) que nunca recebe nada. Por isso senha
// esquecida não tem como recuperar. A senha fica só no Firebase Auth; o
// Firestore guarda um documento por jogador, caderno-saves/{uid}, que só o
// dono lê e grava (regras de segurança no README). O Firebase é carregado
// do CDN só se FIREBASE_CONFIG estiver preenchido; vazio, a conta some da
// capa e o jogo segue igual.
(function () {
  'use strict';
  // Cole aqui o firebaseConfig do app Web (console do Firebase → Configurações
  // do projeto → Seus apps). Essas chaves podem ficar públicas: quem protege
  // os saves são as regras do Firestore.
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyD-8iQbHdM29CCi5VFqiI2_4yxYxXIqFSo',
    authDomain: 'manguebytegames-bdb75.firebaseapp.com',
    projectId: 'manguebytegames-bdb75',
    storageBucket: 'manguebytegames-bdb75.firebasestorage.app',
    messagingSenderId: '533444439350',
    appId: '1:533444439350:web:b959302ac3fff877ba5797',
  };
  const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const USER_DOMAIN = 'caderno-de-aventuras.manguebyte.github.io';
  const COLECAO = 'caderno-saves';

  let auth = null, db = null, user = null, pronto = null;
  const ouvintes = [];
  const avisar = () => ouvintes.forEach(f => f(user));

  const script = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  // Carrega o SDK e espera o Firebase dizer se já tem alguém logado (o login
  // fica guardado no aparelho entre uma visita e outra).
  function iniciar() {
    if (!FIREBASE_CONFIG) return Promise.resolve(false);
    if (pronto) return pronto;
    pronto = script(SDK + 'firebase-app-compat.js')
      .then(() => Promise.all([script(SDK + 'firebase-auth-compat.js'), script(SDK + 'firebase-firestore-compat.js')]))
      .then(() => {
        firebase.initializeApp(FIREBASE_CONFIG);
        auth = firebase.auth(); db = firebase.firestore();
        return new Promise(res => auth.onAuthStateChanged(u => { user = u; avisar(); res(true); }));
      })
      .catch(() => false);
    return pronto;
  }

  // Usuário: 3 a 20 letras minúsculas, números, ponto, hífen ou sublinhado.
  const limpar = nome => String(nome || '').trim().toLowerCase();
  const valido = nome => /^[a-z0-9._-]{3,20}$/.test(nome);
  const nomeDe = u => u ? u.email.split('@')[0] : null;
  // As mensagens do Firebase, em português e sem falar de e-mail.
  const ERROS = {
    'auth/email-already-in-use': 'Esse usuário já existe. Escolha outro ou entre com a senha dele.',
    'auth/invalid-credential': 'Usuário ou senha errados.',
    'auth/wrong-password': 'Usuário ou senha errados.',
    'auth/user-not-found': 'Usuário ou senha errados.',
    'auth/invalid-email': 'Usuário inválido: use de 3 a 20 letras, números, ponto, hífen ou sublinhado.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 letras ou números.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
    'auth/network-request-failed': 'Sem internet. A conta só funciona conectado.',
    'auth/operation-not-supported-in-this-environment': 'A conta não funciona abrindo o jogo direto do disco: abra pelo site (ou por um servidor local).',
  };
  // Erro sem tradução: mostra o código, para dar para descobrir o que houve.
  const erro = e => new Error(ERROS[e && e.code] || `Não deu certo agora (${(e && e.code) || 'erro desconhecido'}). Tente de novo daqui a pouco.`);

  async function entrar(nome, senha, criar) {
    nome = limpar(nome);
    if (!valido(nome)) throw new Error(ERROS['auth/invalid-email']);
    if (!(await iniciar())) throw new Error(ERROS['auth/network-request-failed']);
    const email = `${nome}@${USER_DOMAIN}`;
    try {
      if (criar) await auth.createUserWithEmailAndPassword(email, senha);
      else await auth.signInWithEmailAndPassword(email, senha);
    } catch (e) { throw erro(e); }
    user = auth.currentUser; avisar();
    return nomeDe(user);
  }
  async function sair() { if (auth) await auth.signOut(); user = null; avisar(); }

  // O save vai como texto (o Firestore não aceita lista dentro de lista) e,
  // ao lado, o resumo que a capa mostra sem precisar abrir o save (tempo =
  // segundos jogados).
  async function baixar() {
    if (!user) return null;
    const d = await db.collection(COLECAO).doc(user.uid).get();
    if (!d.exists) return null;
    try { return JSON.parse(d.data().save); } catch (e) { return null; }
  }
  let ultimo = '';
  async function subir(texto) {
    if (!user || !texto || texto === ultimo) return false;
    const s = JSON.parse(texto);
    await db.collection(COLECAO).doc(user.uid).set({
      save: texto, nome: s.P.nome, nivel: s.P.lvl, pagina: s.P.pg + 1, tempo: s.tempo || 0, em: s.em || Date.now(),
      atualizado: firebase.firestore.FieldValue.serverTimestamp(),
    });
    ultimo = texto;
    return true;
  }

  window.Nuvem = {
    get ativa() { return !!FIREBASE_CONFIG; },
    get usuario() { return nomeDe(user); },
    iniciar, entrar, sair, baixar, subir, valido: n => valido(limpar(n)),
    aoMudar: f => ouvintes.push(f),
  };
})();
