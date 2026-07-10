// =====================================================
// MÓDULO DE ETIQUETAS E CONTROLE DE MEDICAÇÃO
// =====================================================

// Abre o modal de etiquetas
function abrirModalEtiquetas() {
    abrir('modalEtiquetas');
    atualizarListaAcolhidosEtiquetas();
}

// Atualiza a lista de acolhidos no dropdown de etiquetas
async function atualizarListaAcolhidosEtiquetas() {
    try {
        const { data, error } = await supabaseClient
            .from('registros')
            .select('id, nome, data_nascimento, cpf, hora, medicamentos')
            .order('nome', { ascending: true });

        if (error) throw error;

        const selectEtiqueta = document.getElementById('etiquetaAcolhidoSelect');
        selectEtiqueta.innerHTML = '<option value="">-- Selecione um Acolhido --</option>';

        if (data && data.length > 0) {
            data.forEach(acolhido => {
                const option = document.createElement('option');
                option.value = JSON.stringify(acolhido);
                option.textContent = acolhido.nome;
                selectEtiqueta.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar acolhidos para etiquetas:', error);
        mostrarToast('Erro ao carregar acolhidos', 'error');
    }
}

// Quando muda a seleção de acolhido, preenche os dados
function aoSelecionarAcolhidoEtiqueta() {
    const selectEtiqueta = document.getElementById('etiquetaAcolhidoSelect');
    if (!selectEtiqueta.value) return;

    try {
        const acolhido = JSON.parse(selectEtiqueta.value);
        
        document.getElementById('etiquetaNome').value = acolhido.nome || '';
        document.getElementById('etiquetaDataNascimento').value = acolhido.data_nascimento || '';
        document.getElementById('etiquetaCPF').value = acolhido.cpf || '';
        
        // Preenche horários
        const horariosArray = acolhido.hora ? String(acolhido.hora).split(',').map(h => h.trim()).filter(Boolean) : [];
        const horariosCheckboxes = document.querySelectorAll('[name="etiquetaHorario"]');
        horariosCheckboxes.forEach(checkbox => {
            checkbox.checked = horariosArray.includes(checkbox.value);
        });

        // Armazena referência do acolhido para uso posterior
        window.acolhidoSelecionadoEtiqueta = acolhido;
    } catch (error) {
        console.error('Erro ao processar acolhido:', error);
    }
}

// Gera PDF da etiqueta
function gerarPdfEtiqueta() {
    const nome = document.getElementById('etiquetaNome').value.trim();
    const dataNascimento = document.getElementById('etiquetaDataNascimento').value;
    const cpf = document.getElementById('etiquetaCPF').value.trim();
    const tamanho = document.getElementById('etiquetaTamanho').value;

    if (!nome) {
        mostrarToast('Preencha o nome do acolhido', 'warning');
        return;
    }

    // Coleta horários selecionados
    const horariosCheckboxes = document.querySelectorAll('[name="etiquetaHorario"]:checked');
    const horarios = Array.from(horariosCheckboxes).map(cb => cb.value).join(' | ');

    // Formata data de nascimento para exibição
    let dataNascFormatada = '';
    if (dataNascimento) {
        const [ano, mes, dia] = dataNascimento.split('-');
        dataNascFormatada = `${dia}/${mes}/${ano}`;
    }

    // Cria HTML para a etiqueta
    let htmlEtiqueta = `
        <div style="
            font-family: Arial, sans-serif;
            width: ${tamanho === 'grande' ? '9.6cm' : '14.6cm'};
            height: ${tamanho === 'grande' ? '5.6cm' : '1.7cm'};
            padding: 0.5cm;
            border: 1px solid #000;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: white;
            color: #000;
        ">
    `;

    if (tamanho === 'grande') {
        htmlEtiqueta += `
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 3px;">${nome}</div>
            <div style="font-size: 11px; margin-bottom: 2px;"><strong>Data Nasc.:</strong> ${dataNascFormatada || '—'}</div>
            <div style="font-size: 11px; margin-bottom: 2px;"><strong>CPF:</strong> ${cpf || '—'}</div>
            <div style="font-size: 10px;"><strong>Horários:</strong> ${horarios || '—'}</div>
        `;
    } else {
        // Tamanho pequeno (meia folha)
        htmlEtiqueta += `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold; font-size: 12px;">${nome}</div>
                    <div style="font-size: 9px;"><strong>CPF:</strong> ${cpf || '—'}</div>
                </div>
                <div style="font-size: 9px; text-align: right;">
                    <strong>Horários:</strong> ${horarios || '—'}
                </div>
            </div>
        `;
    }

    htmlEtiqueta += '</div>';

    // Usa html2pdf para gerar o PDF
    const element = document.createElement('div');
    element.innerHTML = htmlEtiqueta;
    
    const opt = {
        margin: 0,
        filename: `etiqueta_${nome.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: tamanho === 'grande' ? [9.6, 5.6] : [14.6, 1.7], orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    mostrarToast('Etiqueta gerada com sucesso!', 'success');
}

// Atualiza lista de acolhidos para controle de medicação
async function atualizarListaAcolhidosContraMed() {
    try {
        const { data, error } = await supabaseClient
            .from('registros')
            .select('id, nome, hora, medicamentos')
            .order('nome', { ascending: true });

        if (error) throw error;

        const selectContra = document.getElementById('contraMedAcolhidoSelect');
        selectContra.innerHTML = '<option value="">-- Selecione um Acolhido --</option>';

        if (data && data.length > 0) {
            data.forEach(acolhido => {
                const option = document.createElement('option');
                option.value = JSON.stringify(acolhido);
                option.textContent = acolhido.nome;
                selectContra.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar acolhidos para controle:', error);
        mostrarToast('Erro ao carregar acolhidos', 'error');
    }
}

// Quando muda a seleção para controle de medicação
function aoSelecionarAcolhidoContraMed() {
    const selectContra = document.getElementById('contraMedAcolhidoSelect');
    if (!selectContra.value) return;

    try {
        const acolhido = JSON.parse(selectContra.value);
        
        // Preenche nome
        document.getElementById('contraMedNome').value = acolhido.nome || '';

        // Preenche medicamentos
        document.getElementById('contraMedMedicamentos').value = acolhido.medicamentos || '';

        // Preenche horários
        const horariosArray = acolhido.hora ? String(acolhido.hora).split(',').map(h => h.trim()).filter(Boolean) : [];
        
        let horariosHTML = '';
        horariosArray.forEach((horario, index) => {
            horariosHTML += `
                <div class="contra-med-horario-item">
                    <strong>${horario}</strong>
                    <table style="width:100%; border-collapse:collapse; font-size:10px;">
                        <tr>
                            <th style="border:1px solid #000; padding:2px;">Sem 1</th>
                            <th style="border:1px solid #000; padding:2px;">Sem 2</th>
                            <th style="border:1px solid #000; padding:2px;">Sem 3</th>
                            <th style="border:1px solid #000; padding:2px;">Sem 4</th>
                            <th style="border:1px solid #000; padding:2px;">Conf.</th>
                            <th style="border:1px solid #000; padding:2px;">Assis.</th>
                            <th style="border:1px solid #000; padding:2px;">Plantão</th>
                        </tr>
                        <tr>
                            <td style="border:1px solid #000; padding:4px; text-align:center;">☐</td>
                            <td style="border:1px solid #000; padding:4px; text-align:center;">☐</td>
                            <td style="border:1px solid #000; padding:4px; text-align:center;">☐</td>
                            <td style="border:1px solid #000; padding:4px; text-align:center;">☐</td>
                            <td style="border:1px solid #000; padding:4px; text-align:center;">☐</td>
                            <td style="border:1px solid #000; padding:4px;"></td>
                            <td style="border:1px solid #000; padding:4px;"></td>
                        </tr>
                    </table>
                </div>
            `;
        });

        document.getElementById('contraMedHorarios').innerHTML = horariosHTML;
        
        // Armazena referência
        window.acolhidoSelecionadoContraMed = acolhido;
    } catch (error) {
        console.error('Erro ao processar acolhido para controle:', error);
    }
}

// Gera PDF do controle de medicação
function gerarPdfControleMedicacao() {
    const nome = document.getElementById('contraMedNome').value.trim();
    const medicamentos = document.getElementById('contraMedMedicamentos').value.trim();

    if (!nome) {
        mostrarToast('Selecione um acolhido primeiro', 'warning');
        return;
    }

    let htmlControle = `
        <div style="
            font-family: Arial, sans-serif;
            width: 29.7cm;
            height: 14.85cm;
            padding: 1cm;
            background: white;
            color: #000;
        ">
            <div style="text-align: center; margin-bottom: 0.5cm;">
                <h2 style="margin: 0; font-size: 16px;">CONTROLE DE MEDICAÇÃO</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1cm; font-size: 11px;">
                <div>
                    <div style="margin-bottom: 0.3cm;">
                        <strong>Nome do Acolhido:</strong> ${nome}
                    </div>
                    <div style="margin-bottom: 0.3cm;">
                        <strong>Medicamento(s):</strong> ${medicamentos}
                    </div>
                </div>
                <div>
                    <div style="margin-bottom: 0.3cm;">
                        <strong>Quantidade por Blister:</strong><br>
                        ☐ 10 &nbsp; ☐ 15 &nbsp; ☐ 21 &nbsp; ☐ 28 &nbsp; ☐ 30
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 0.5cm; font-size: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e0e0e0;">
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Horário</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Semana 1</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Semana 2</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Semana 3</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Semana 4</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Conf.</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Assis.</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Plantão</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Observação</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Horários padrão
    const horarios = ['07h', '15h', '19h', '23h'];
    horarios.forEach(hora => {
        htmlControle += `
            <tr style="height: 2cm;">
                <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">${hora}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">☐</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">☐</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">☐</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">☐</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">☐</td>
                <td style="border: 1px solid #000; padding: 4px;"></td>
                <td style="border: 1px solid #000; padding: 4px;"></td>
                <td style="border: 1px solid #000; padding: 4px;"></td>
            </tr>
        `;
    });

    htmlControle += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlControle;

    const opt = {
        margin: 0,
        filename: `controle_medicacao_${nome.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
    mostrarToast('Controle de medicação gerado com sucesso!', 'success');
}

// Inicializa as abas do modal de etiquetas
function inicializarAbasEtiquetas() {
    const abasButtons = document.querySelectorAll('.etiquetas-aba-btn');
    const abasConteudo = document.querySelectorAll('.etiquetas-aba-conteudo');

    abasButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove classe ativa de todos
            abasButtons.forEach(b => b.classList.remove('ativa'));
            abasConteudo.forEach(c => c.classList.remove('ativa'));

            // Adiciona classe ativa ao clicado
            btn.classList.add('ativa');
            const abaId = btn.getAttribute('data-aba');
            document.getElementById(abaId).classList.add('ativa');

            // Se é a aba de controle, carrega dados
            if (abaId === 'abaControleMedicacao') {
                atualizarListaAcolhidosContraMed();
            }
        });
    });
}
