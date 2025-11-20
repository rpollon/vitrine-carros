document.addEventListener('DOMContentLoaded', () => {
    const carrosselContainer = document.getElementById('carrossel-container');
    const modal = document.getElementById('modal-lead');
    const formLead = document.getElementById('form-lead');
    const btnFecharModal = document.getElementById('btn-fechar-modal');
    const carroSelecionadoInput = document.getElementById('carro-selecionado');

    // 1. URL DE CONTEÚDO (SUA PLANILHA DE CARROS) - DEVE TERMINAR EM output=csv
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4UYJgaHtWLW0cjjvyaexPmL7atrFWNCaj6BHwn6k8ZQP90a2ViAWonJSgP0nKCIM5L4BrCZ7KWiLU/pub?gid=1842449585&single=true&output=csv';

    // 2. URL DE LEADS (URL GERADO PELO GOOGLE APPS SCRIPT)
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwygohlGLDAEnOsSwPTpQVFypwgls7lmflybSJlFklTvWP8VetNmkg_VPRPQBA9SHmr7A/exec'; 


    // Funções Auxiliares --------------------------------------------------------------------------------

    // Função auxiliar para converter o CSV em um array de objetos (JSON)
    function csvToJson(csv) {
        const lines = csv.split('\n');
        // Usar map para trim e toLowerCase nos cabeçalhos (Modelo, Preco, Link_Foto, Ativo)
        const headers = lines[0].split(',').map(header => header.trim().toLowerCase().replace(/\s/g, '_'));
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentline = lines[i].split(',');

            for (let j = 0; j < headers.length; j++) {
                let value = currentline[j] ? currentline[j].trim().replace(/"/g, '') : '';
                obj[headers[j]] = value;
            }
            if (obj.modelo) { // Ignora linhas sem modelo
                result.push(obj);
            }
        }
        return result;
    }


    // 1. FUNÇÃO PARA CARREGAR OS DADOS (LÊ CSV) ----------------------------------------------------------
    async function carregarVeiculos() {
        try {
            const response = await fetch(CSV_URL);
            const csvData = await response.text();
            
            const veiculos = csvToJson(csvData);

            carrosselContainer.innerHTML = ''; 

            // Filtra e normaliza: Colunas na planilha são minúsculas: 'modelo', 'preco', 'link_foto', 'ativo'
            const veiculosAtivos = veiculos.filter(v => v.ativo && v.ativo.toUpperCase() === 'SIM');

            if (veiculosAtivos.length === 0) {
                carrosselContainer.innerHTML = '<div class="veiculo-slide"><h2>Nenhum veículo ativo no momento.</h2></div>';
                return;
            }

            veiculosAtivos.forEach((veiculo) => {
                const slide = document.createElement('div');
                slide.classList.add('veiculo-slide');
                
                slide.innerHTML = `
                    <img src="${veiculo.link_foto}" alt="${veiculo.modelo}">
                    <div class="info-overlay">
                        <div class="info-texto">
                            <h2>${veiculo.modelo}</h2>
                            <p>${veiculo.preco}</p>
                        </div>
                        <button class="btn-quero" data-modelo="${veiculo.modelo}">
                            [ QUERO ESSE CARRO ]
                        </button>
                    </div>
                `;
                
                carrosselContainer.appendChild(slide);
            });
            
            adicionarEventosBotoes();

        } catch (error) {
            console.error('Erro ao carregar os veículos da Planilha:', error);
            carrosselContainer.innerHTML = '<div class="veiculo-slide"><h2>Erro ao carregar dados. Verifique a publicação do CSV.</h2></div>';
        }
    }


    // 2. FUNÇÕES DE INTERAÇÃO (MODAL) -------------------------------------------------------------------
    function adicionarEventosBotoes() {
        document.querySelectorAll('.btn-quero').forEach(button => {
            button.removeEventListener('click', handleQueroClick);
            button.addEventListener('click', handleQueroClick);
        });
        
        btnFecharModal.addEventListener('click', () => {
            modal.style.display = 'none';
            formLead.reset(); 
        });
    }

    function handleQueroClick(event) {
        const modelo = event.target.getAttribute('data-modelo');
        modal.classList.remove('modal-oculto');
        modal.style.display = 'flex';
        carroSelecionadoInput.value = modelo;
    }


    // 3. FUNÇÃO DE ENVIO DE LEAD (WEBHOOK) -------------------------------------------------------------
    formLead.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const nome = document.getElementById('nome').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const carro = carroSelecionadoInput.value;

        const dadosLead = {
            carro: carro,
            nome: nome,
            whatsapp: whatsapp
        };
        
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosLead)
            });

            // O retorno do Apps Script será um JSON
            const resultado = await response.json(); 

            if (resultado.status === 'sucesso') {
                alert("Obrigado(a), " + nome + "! Em breve o vendedor entrará em contato com você.");
            } else {
                alert("Ocorreu um erro no envio do lead. Verifique o Apps Script.");
            }

        } catch (error) {
            console.error("Erro ao enviar lead:", error);
            alert("Erro de conexão. Tente novamente ou chame o vendedor.");
        }

        modal.style.display = 'none';
        formLead.reset();
    });

    // INÍCIO DO PROJETO
    carregarVeiculos();

});
