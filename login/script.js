// Tabs functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const forms = document.querySelectorAll('.form');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Remove active class from all tabs and forms
        tabBtns.forEach(b => b.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        
        // Add active class to clicked tab
        btn.classList.add('active');
        
        // Show corresponding form
        if (tab === 'login') {
            document.getElementById('login-form').classList.add('active');
        } else {
            document.getElementById('registro-form').classList.add('active');
        }
    });
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Toggle between login and register
const toggleRegistroLink = document.getElementById('toggle-registro');
toggleRegistroLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Switch to registro tab
    tabBtns.forEach(b => b.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    tabBtns[1].classList.add('active');
    document.getElementById('registro-form').classList.add('active');
});

// Substitua o evento de submit do login-form por este:

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // SIMULAÇÃO DE LOGIN (em produção, isso viria do backend)
    if (email && password) {
        // Salva dados do usuário (opcional)
        localStorage.setItem('usuarioLogado', JSON.stringify({
            email: email,
            nome: email.split('@')[0],
            logado: true
        }));
        
        // Mostra mensagem de sucesso
        const btn = document.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENTRANDO...';
        btn.disabled = true;
        
        // Aguarda 1 segundo e redireciona
        setTimeout(() => {
            window.location.href = '../inicio/index.html';
            // OU para o dashboard:
            // window.location.href = '../dashboard/index.html';
        }, 1000);
        
    } else {
        alert('Por favor, preencha todos os campos!');
    }
});
    // Aqui você adicionaria a lógica de login
    console.log('Login:', { email, password });
    
    // Simulação de login
    alert('Login realizado com sucesso! Bem-vindo ao Painel Zero.');
    // window.location.href = '../inicio/index.html';


document.getElementById('registro-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('registro-nome').value;
    const email = document.getElementById('registro-email').value;
    const password = document.getElementById('registro-password').value;
    
    // Aqui você adicionaria a lógica de registro
    console.log('Registro:', { nome, email, password });
    
    // Simulação de registro
    alert('Conta criada com sucesso! Faça login para continuar.');
    
    // Switch back to login tab
    tabBtns.forEach(b => b.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    tabBtns[0].classList.add('active');
    document.getElementById('login-form').classList.add('active');
});

// Social login buttons
document.querySelectorAll('.btn-social').forEach(btn => {
    btn.addEventListener('click', () => {
        const provider = btn.querySelector('span').textContent;
        alert(`Login com ${provider} em desenvolvimento...`);
    });
});

// Forgot password
document.querySelector('.forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    if (email) {
        alert(`Link de recuperação enviado para: ${email}`);
    } else {
        alert('Por favor, digite seu e-mail primeiro.');
        document.getElementById('login-email').focus();
    }
});

// Add input animation
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.parentElement.classList.remove('focused');
        }
    });
});