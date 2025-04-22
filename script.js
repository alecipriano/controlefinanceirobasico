const form = document.getElementById('formulario');
const tipoInput = document.getElementById('tipo');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const dataInput = document.getElementById('data');
const submitBtn = document.getElementById('submit-btn');

const tabela = document.querySelector('#tabela-gastos tbody');
const totalGastos = document.getElementById('total-gastos');
const totalReceitas = document.getElementById('total-receitas');
const saldo = document.getElementById('saldo');

let registros = JSON.parse(localStorage.getItem('registros')) || [];

const formatarData = (data) => {
   const [ano, mes, dia] = data.split('-');
   return `${dia}/${mes}/${ano}`;
};

const atualizarTabela = () => {
   tabela.innerHTML = '';
   let receitas = 0;
   let gastos = 0;

   registros.forEach((registro, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
         <td>${registro.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
         <td>${registro.descricao}</td>
         <td class="${registro.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida'}">R$ ${registro.valor.toFixed(2)}</td>
         <td>${formatarData(registro.data)}</td>
         <td>
            <button class="acao-btn editar" data-index="${index}">Editar</button>
            <button class="acao-btn excluir" data-index="${index}">Excluir</button>
         </td>
      `;
      tabela.appendChild(tr);

      if (registro.tipo === 'entrada') {
         receitas += registro.valor;
      } else {
         gastos += registro.valor;
      }
   });

   totalReceitas.innerHTML = `R$ ${receitas.toFixed(2)}`;
   totalGastos.innerHTML = `R$ ${gastos.toFixed(2)}`;
   saldo.innerHTML = `R$ ${(receitas - gastos).toFixed(2)}`;
   saldo.className = (receitas - gastos) >= 0 ? 'positivo' : 'negativo';
};

// Adicionando a ordenação
document.getElementById('ordenar-por').addEventListener('change', (e) => {
   const criterio = e.target.value;

   registros.sort((a, b) => {
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);

      switch (criterio) {
         case 'data-desc':
            return dataB - dataA;
         case 'data-asc':
            return dataA - dataB;
         case 'valor-desc':
            return b.valor - a.valor;
         case 'valor-asc':
            return a.valor - b.valor;
         default:
            return 0;
      }
   });

   atualizarTabela(); // Reexibe a tabela ordenada
});

const adicionarRegistro = (evento) => {
   evento.preventDefault();

   const tipo = tipoInput.value;
   const descricao = descricaoInput.value;
   const valor = parseFloat(valorInput.value);
   const data = dataInput.value;

   if (isNaN(valor) || !descricao || !data) return;

   const novoRegistro = { tipo, descricao, valor, data };

   registros.push(novoRegistro);
   localStorage.setItem('registros', JSON.stringify(registros));

   descricaoInput.value = '';
   valorInput.value = '';
   dataInput.value = '';

   atualizarTabela();
};

const editarRegistro = (evento) => {
   const index = evento.target.dataset.index;
   const registro = registros[index];

   tipoInput.value = registro.tipo;
   descricaoInput.value = registro.descricao;
   valorInput.value = registro.valor;
   dataInput.value = registro.data;
   submitBtn.innerHTML = '<i class="fas fa-edit"></i> Salvar';
   submitBtn.classList.add('edicao');
   submitBtn.dataset.index = index;
};

const salvarEdicao = (evento) => {
   evento.preventDefault();
   const index = submitBtn.dataset.index;
   const tipo = tipoInput.value;
   const descricao = descricaoInput.value;
   const valor = parseFloat(valorInput.value);
   const data = dataInput.value;

   if (isNaN(valor) || !descricao || !data) return;

   const registroEditado = { tipo, descricao, valor, data };
   registros[index] = registroEditado;

   localStorage.setItem('registros', JSON.stringify(registros));

   descricaoInput.value = '';
   valorInput.value = '';
   dataInput.value = '';
   submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Adicionar';
   submitBtn.classList.remove('edicao');
   submitBtn.dataset.index = '';

   atualizarTabela();
};

const excluirRegistro = (evento) => {
   const index = evento.target.dataset.index;
   registros.splice(index, 1);
   localStorage.setItem('registros', JSON.stringify(registros));
   atualizarTabela();
};

const gerarRelatorio = () => {
   const ctx = document.getElementById('grafico').getContext('2d');
   const receitas = registros.filter(r => r.tipo === 'entrada').reduce((acc, r) => acc + r.valor, 0);
   const gastos = registros.filter(r => r.tipo === 'saida').reduce((acc, r) => acc + r.valor, 0);
   const saldoTotal = receitas - gastos;

   if (window.graficoAtual) {
      window.graficoAtual.destroy(); // Destroi o gráfico anterior se houver
   }

   window.graficoAtual = new Chart(ctx, {
      type: 'bar',
      data: {
         labels: ['Receitas', 'Gastos', 'Saldo'],
         datasets: [{
            label: 'Valores',
            data: [receitas, gastos, saldoTotal],
            backgroundColor: ['green', 'red', 'blue'],
            borderColor: ['green', 'red', 'blue'],
            borderWidth: 1
         }]
      },
      options: {
         responsive: true,
         plugins: {
            legend: { display: false }
         }
      }
   });

   document.getElementById('grafico-container').style.display = 'block';
};

const exportarCSV = () => {
   if (registros.length === 0) {
      alert("Não há registros para exportar.");
      return;
   }

   // Cabeçalho
   let csv = 'Tipo;Descrição;Valor;Data\n';

   // Linhas
   registros.forEach(r => {
      const tipo = r.tipo === 'entrada' ? 'Entrada' : 'Saída';
      const descricao = r.descricao.replace(/;/g, ','); // evitar quebrar CSV com ;
      const valor = r.valor.toFixed(2).replace('.', ','); // formato PT-BR
      const data = new Date(r.data).toLocaleDateString('pt-BR');
      csv += `${tipo};${descricao};${valor};${data}\n`;
   });

   // Codificar corretamente com BOM para compatibilidade com Excel
   const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);

   const a = document.createElement('a');
   a.setAttribute('href', url);
   a.setAttribute('download', 'controle-financeiro.csv');
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
};


form.addEventListener('submit', (evento) => {
   if (submitBtn.classList.contains('edicao')) {
      salvarEdicao(evento);
   } else {
      adicionarRegistro(evento);
   }
});

tabela.addEventListener('click', (evento) => {
   if (evento.target.classList.contains('editar')) {
      editarRegistro(evento);
   } else if (evento.target.classList.contains('excluir')) {
      excluirRegistro(evento);
   }
});

document.getElementById('gerar-relatorio').addEventListener('click', gerarRelatorio);
document.getElementById('exportar-csv').addEventListener('click', exportarCSV);

atualizarTabela();
