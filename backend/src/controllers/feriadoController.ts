import { Request, Response } from 'express';
import feriadoService from '../services/feriadoService';

export class FeriadoController {
  // GET /api/feriados/:ano
  async listarPorAno(req: Request, res: Response) {
    try {
      const ano = parseInt(req.params.ano);

      if (isNaN(ano) || ano < 2000 || ano > 2100) {
        return res.status(400).json({ erro: 'Ano inválido' });
      }

      const feriados = await feriadoService.listarFeriados(ano);
      res.json(feriados);
    } catch (error) {
      console.error('Erro ao listar feriados:', error);
      res.status(500).json({ erro: 'Erro ao listar feriados' });
    }
  }

  // POST /api/feriados/ajustar-data
  async ajustarData(req: Request, res: Response) {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({ erro: 'Data é obrigatória' });
      }

      const dataOriginal = new Date(data);
      const dataAjustada = await feriadoService.ajustarParaDiaUtil(dataOriginal);

      res.json({
        dataOriginal: dataOriginal.toISOString().split('T')[0],
        dataAjustada: dataAjustada.toISOString().split('T')[0],
        ajustada: dataOriginal.getTime() !== dataAjustada.getTime()
      });
    } catch (error) {
      console.error('Erro ao ajustar data:', error);
      res.status(500).json({ erro: 'Erro ao ajustar data' });
    }
  }
}

export default new FeriadoController();

