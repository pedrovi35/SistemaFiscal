import { Router } from 'express';
import obrigacaoController from '../controllers/obrigacaoController';
import feriadoController from '../controllers/feriadoController';
import clienteController from '../controllers/clienteController';

const router = Router();

// Rotas de obrigações
router.get('/obrigacoes', obrigacaoController.listarTodas.bind(obrigacaoController));
router.get('/obrigacoes/filtrar', obrigacaoController.filtrar.bind(obrigacaoController));
router.get('/obrigacoes/:id', obrigacaoController.buscarPorId.bind(obrigacaoController));
router.post('/obrigacoes', obrigacaoController.criar.bind(obrigacaoController));
router.put('/obrigacoes/:id', obrigacaoController.atualizar.bind(obrigacaoController));
router.delete('/obrigacoes/:id', obrigacaoController.deletar.bind(obrigacaoController));
router.get('/obrigacoes/:id/historico', obrigacaoController.buscarHistorico.bind(obrigacaoController));
router.post('/obrigacoes/:id/gerar-proxima', obrigacaoController.gerarProxima.bind(obrigacaoController));

// Rotas de recorrência automática
router.post('/obrigacoes/:id/recorrencia/pausar', obrigacaoController.pausarRecorrencia.bind(obrigacaoController));
router.post('/obrigacoes/:id/recorrencia/retomar', obrigacaoController.retomarRecorrencia.bind(obrigacaoController));
router.get('/obrigacoes/:id/recorrencia/historico', obrigacaoController.buscarHistoricoRecorrencia.bind(obrigacaoController));

// Rotas de feriados
router.get('/feriados/:ano', feriadoController.listarPorAno.bind(feriadoController));
router.post('/feriados/ajustar-data', feriadoController.ajustarData.bind(feriadoController));

// Rotas de clientes
router.get('/clientes', clienteController.listarTodos.bind(clienteController));
router.get('/clientes/ativos', clienteController.listarAtivos.bind(clienteController));
router.get('/clientes/cnpj/:cnpj', clienteController.buscarPorCnpj.bind(clienteController));
router.get('/clientes/:id', clienteController.buscarPorId.bind(clienteController));
router.post('/clientes', clienteController.criar.bind(clienteController));
router.put('/clientes/:id', clienteController.atualizar.bind(clienteController));
router.delete('/clientes/:id', clienteController.deletar.bind(clienteController));
router.delete('/clientes/:id/permanente', clienteController.deletarPermanente.bind(clienteController));

export default router;

