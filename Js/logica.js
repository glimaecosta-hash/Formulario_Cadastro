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

// --- CONEXÃO DO CADASTRO COM O BACKEND ---

const formCadastro = document.getElementById("form-cadastro");

formCadastro.addEventListener("submit", async (event) => {
  event.preventDefault(); // Impede a página de recarregar ao enviar o formulário

  // 1. Capturamos o que o usuário digitou em cada campo do cadastro
  const nome = document.getElementById("new-name").value;
  const usuario = document.getElementById("new-username").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("new-password").value;
  const confirmarSenha = document.getElementById("confirm-password").value;

  // 2. Validação básica de senhas iguais no Front-end
  if (senha !== confirmarSenha) {
    alert("Erro: As senhas digitadas não são iguais!");
    return; // Para o código aqui e não envia para a API
  }

  try {
    // 3. Enviamos os dados para a nossa API em Python
    const resposta = await fetch("http://127.0.0.1:8000/api/cadastro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nome,
        usuario: usuario,
        email: email,
        senha: senha,
      }),
    });

    // 4. Lemos a resposta que a API enviou de volta
    const resultado = await resposta.json();

    // 5. Exibimos a mensagem que veio do Python em um alerta na tela
    alert(resultado.mensagem);

    if (resultado.status === "sucesso") {
      // Se deu certo, limpamos o formulário
      formCadastro.reset();

      // Opcional: Simulamos o clique no botão "Entrar" para mandar o usuário para a tela de login
      btnEntrar.click();
    }
  } catch (error) {
    // Se a API estiver desligada ou der erro de rede
    alert(
      "Não foi possível conectar ao servidor backend. Verifique se o Python está rodando!",
    );
  }
});

// Selecionando o formulário de login do HTML
const formularioLogin = document.getElementById("formulario-login"); // Ajuste o ID se o seu for diferente!

formularioLogin.addEventListener("submit", async (event) => {
  event.preventDefault(); // Impede a página de recarregar

  // 1. Pegando os valores digitados na tela
  const usuarioInput = document.getElementById("campo-usuario").value; // Ajuste o ID do input de usuário
  const senhaInput = document.getElementById("campo-senha").value; // Ajuste o ID do input de senha
  const mensagemErro = document.getElementById("mensagem-erro"); // Campo onde vamos exibir os avisos na tela

  // Limpa mensagens de erro anteriores
  mensagemErro.textContent = "";
  mensagemErro.style.color = "";

  try {
    // 2. Enviando os dados para a nossa API FastAPI
    const resposta = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario: usuarioInput,
        senha: senhaInput,
      }),
    });

    const resultado = await resposta.json();

    // 3. Verificando o retorno do servidor
        if (resposta.ok && resultado.status === 'sucesso') {
            // LOGIN DEU CERTO! 🎉
            mensagemErro.textContent = resultado.mensagem;
            mensagemErro.style.color = 'green';

            // Selecionamos o nosso card de aviso do HTML
            const cardAviso = document.getElementById('card-aviso');
            
            // Mostra o card deslizando ele para a tela
            cardAviso.classList.add('mostrar');

            // Limpa os campos da tela de login
            document.getElementById('campo-usuario').value = '';
            document.getElementById('campo-senha').value = '';

            // Fecha o card automaticamente após 10 segundos (10000 milissegundos)
            // Se preferir 1 minuto de verdade, mude para 60000!
            setTimeout(() => {
                cardAviso.classList.remove('mostrar');
            }, 10000); 

        } else {
      // LOGIN DEU ERRO (Usuário ou senha incorretos, etc.)
      mensagemErro.textContent =
        resultado.mensagem || "Erro ao realizar login.";
      mensagemErro.style.color = "red";
    }
  } catch (erro) {
    console.error("Erro na conexão:", erro);
    mensagemErro.textContent =
      "Não foi possível conectar ao servidor. Verifique se a API está rodando!";
    mensagemErro.style.color = "red";
  }
});
