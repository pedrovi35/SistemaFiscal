import { Router } from 'express';
import obrigacaoController from '../controllers/obrigacaoController';
import feriadoController from '../controllers/feriadoController';

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

// Rotas de feriados
router.get('/feriados/:ano', feriadoController.listarPorAno.bind(feriadoController));
router.post('/feriados/ajustar-data', feriadoController.ajustarData.bind(feriadoController));

export default router;

