// ============================================
//   CONFIGURAÇÕES GLOBAIS
// ============================================

const API_URL = "https://api-formulario-cadastro-main.onrender.com";

// Chaves usadas no localStorage (centralizadas para fácil manutenção)
const TOKEN_KEY = "access_token";
const USER_KEY = "usuario_logado";

const btnEntrar = document.getElementById("btn-entrar");
const btnCadastrar = document.getElementById("btn-cadastrar");

const telaLogin = document.getElementById("login-acesso");
const telaCadastro = document.getElementById("cadastro-acesso");

btnCadastrar.addEventListener("click", () => {
  telaLogin.style.display = "none";
  telaCadastro.style.display = "flex";
  btnEntrar.classList.remove("ativo");
  btnCadastrar.classList.add("ativo");
});

btnEntrar.addEventListener("click", () => {
  telaCadastro.style.display = "none";
  telaLogin.style.display = "flex";
  btnCadastrar.classList.remove("ativo");
  btnEntrar.classList.add("ativo");
});

// ============================================
//   FUNÇÕES AUXILIARES DE API
// ============================================

/**
 * Faz requisições HTTP para a API, adicionando automaticamente
 * o header Authorization: Bearer <token> se houver token salvo.
 * Trata erros padronizados do FastAPI (HTTPException).
 */
async function requisitar(endpoint, opcoes = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    // 🚫 Evita cache do navegador em qualquer requisição
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...(opcoes.headers || {}),
  };

  // 🛡️ Envio automático do token em toda requisição
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // URL com timestamp para evitar cache de GET
  let url = `${API_URL}${endpoint}`;
  if ((opcoes.method || "GET").toUpperCase() === "GET") {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}_t=${Date.now()}`;
  }

  console.log(`📤 ${opcoes.method || "GET"} ${url}`);

  try {
    const resposta = await fetch(url, {
      ...opcoes,
      headers,
      // 🚫 Reforça a não usar cache do navegador
      cache: "no-store",
    });

    console.log(`📥 Resposta: ${resposta.status} ${resposta.statusText}`);

    // 204 No Content (resposta vazia)
    if (resposta.status === 204) {
      return null;
    }

    // Sucesso (200, 201)
    if (resposta.ok) {
      return await resposta.json();
    }

    // ⏰ Auto-deslogar: token expirado ou inválido
    if (resposta.status === 401) {
      logout();
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    // Tenta ler o corpo do erro padronizado
    let erro;
    try {
      erro = await resposta.json();
    } catch {
      throw new Error(`Erro ${resposta.status}: ${resposta.statusText}`);
    }

    // 422 = validação do Pydantic (lista de erros)
    if (resposta.status === 422 && Array.isArray(erro.detail)) {
      const primeiroErro = erro.detail[0];
      const campo = primeiroErro.loc[primeiroErro.loc.length - 1] || "campo";
      throw new Error(`${campo}: ${primeiroErro.msg}`);
    }

    // Outros erros (400, 500) → { detail: "mensagem" }
    throw new Error(erro.detail || `Erro ${resposta.status}`);
  } catch (err) {
    // Erro de rede (API desligada / CORS)
    if (err instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar ao servidor. Verifique se a API está rodando!",
      );
    }
    throw err;
  }
}

// ============================================
//   SESSÃO E TOKEN
// ============================================

function salvarSessao(accessToken, dadosUsuario) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(dadosUsuario));
  console.log("✅ Token salvo no localStorage:", accessToken);
}

function obterUsuarioLogado() {
  const dados = localStorage.getItem(USER_KEY);
  return dados ? JSON.parse(dados) : null;
}

function estaLogado() {
  return !!localStorage.getItem(TOKEN_KEY);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  console.log("🚪 Sessão encerrada (logout).");
}

async function carregarPerfil() {
  try {
    const perfil = await requisitar("/api/me", { method: "GET" });
    console.log("👤 Perfil carregado:", perfil);

    if (perfil) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          usuario: perfil.usuario,
          nome: perfil.nome,
          email: perfil.email,
        }),
      );
    }
    return perfil;
  } catch (err) {
    console.warn("⚠️ Não foi possível carregar o perfil:", err.message);
    return null;
  }
}

// ============================================
//   CADASTRO
// ============================================

const formCadastro = document.getElementById("form-cadastro");

function validarCadastro(dados) {
  if (dados.nome.length < 2) {
    return "O nome deve ter pelo menos 2 caracteres!";
  }
  if (dados.usuario.length < 3) {
    return "O nome de usuário deve ter pelo menos 3 caracteres!";
  }
  if (dados.senha.length < 6) {
    return "A senha deve ter pelo menos 6 caracteres!";
  }
  return null;
}

formCadastro.addEventListener("submit", async (event) => {
  event.preventDefault();

  // 1. Capturamos os valores do formulário
  const nome = document.getElementById("new-name").value.trim();
  const usuario = document.getElementById("new-username").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("new-password").value;
  const confirmarSenha = document.getElementById("confirm-password").value;

  console.log("📝 Tentando cadastrar:", { nome, usuario, email });

  // 2. Validação de senhas iguais
  if (senha !== confirmarSenha) {
    alert("Erro: As senhas digitadas não são iguais!");
    return;
  }

  // 3. Validação de tamanhos mínimos
  const erroValidacao = validarCadastro({ nome, usuario, senha });
  if (erroValidacao) {
    alert(erroValidacao);
    return;
  }

  // 4. 🚨 Limpa qualquer sessão antiga ANTES de cadastrar
  logout();

  // 5. Feedback visual
  const btnSubmit = formCadastro.querySelector('button[type="submit"]');
  const textoOriginal = btnSubmit ? btnSubmit.textContent : null;
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Cadastrando...";
  }

  // 6. Envia para a API
  try {
    const resultado = await requisitar("/api/cadastro", {
      method: "POST",
      body: JSON.stringify({ nome, usuario, email, senha }),
    });

    console.log("✅ Cadastro realizado:", resultado);

    let msg = resultado.mensagem || "Cadastro realizado com sucesso!";
    if (resultado.email_enviado === false) {
      msg += "\n\n⚠️ Não foi possível enviar o e-mail de boas-vindas.";
    } else if (resultado.email_enviado === true) {
      msg += "\n\n📧 Verifique sua caixa de entrada!";
    }
    alert(msg);

    formCadastro.reset();
    btnEntrar.click();
  } catch (error) {
    console.error("❌ Erro no cadastro:", error.message);
    alert("Erro ao cadastrar: " + error.message);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      if (textoOriginal) btnSubmit.textContent = textoOriginal;
    }
  }
});

// ============================================
//   LOGIN
// ============================================

const formularioLogin = document.getElementById("formulario-login");

formularioLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  let usuarioInput = document.getElementById("campo-usuario").value.trim();
  const senhaInput = document.getElementById("campo-senha").value;
  const mensagemErro = document.getElementById("mensagem-erro");

  if (!usuarioInput.startsWith("@")) {
    usuarioInput = `@${usuarioInput}`;
  }

  mensagemErro.textContent = "";
  mensagemErro.style.color = "";

  try {
    const resultado = await requisitar("/api/login", {
      method: "POST",
      body: JSON.stringify({
        usuario: usuarioInput,
        senha: senhaInput,
      }),
    });

    mensagemErro.textContent = resultado.mensagem || "Login realizado com sucesso!";
    mensagemErro.style.color = "green";

    if (resultado.access_token) {
      salvarSessao(resultado.access_token, {
        usuario: resultado.usuario,
        nome: resultado.nome,
      });
      await carregarPerfil();
    }

    const cardAviso = document.getElementById("card-aviso");
    if (cardAviso) {
      cardAviso.classList.add("mostrar");
      setTimeout(() => cardAviso.classList.remove("mostrar"), 10000);
    }

    document.getElementById("campo-usuario").value = "";
    document.getElementById("campo-senha").value = "";
  } catch (error) {
    mensagemErro.textContent = error.message;
    mensagemErro.style.color = "red";
  }
});

// ============================================
//   🔄 SESSÃO AUTOMÁTICA AO CARREGAR A PÁGINA
// ============================================

(async function verificarSessao() {
  if (estaLogado()) {
    console.log("🔐 Token encontrado no localStorage. Verificando validade...");
    const perfil = await carregarPerfil();
    if (perfil) {
      console.log(`👋 Bem-vindo de volta, ${perfil.nome || perfil.usuario}!`);
    } else {
      console.warn("⚠️ Token salvo é inválido ou expirou. Faça login novamente.");
    }
  }
})();