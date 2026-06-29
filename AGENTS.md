# Regras permanentes de trabalho e publicação

- Trabalhar somente dentro deste repositório.
- A branch de produção é `main`.
- Antes de editar, verificar a branch atual, o remote `origin` e o `git status`.
- Preservar tudo que não fizer parte do pedido atual.
- Nunca usar `git push --force`.
- Fazer todas as alterações solicitadas localmente.
- Revisar o diff antes da publicação.
- Não publicar depois de cada pequeno ajuste; publicar apenas uma vez, no final da tarefa.
- No final, executar obrigatoriamente `publish-site.ps1`.
- Uma tarefa não está concluída somente por ter editado arquivos, criado um commit ou feito push.
- Só considerar a tarefa concluída quando:
  1. o commit local existir;
  2. o push para `origin/main` tiver sido confirmado;
  3. o `HEAD` local for igual a `origin/main`;
  4. o GitHub Pages tiver publicado a nova versão;
  5. a versão online tiver sido validada.
- Se a publicação falhar ou atingir o timeout, informar claramente que não foi possível confirmar o deploy.
- No relatório final, informar os arquivos modificados, o hash do commit, o status do push, a confirmação do GitHub Pages e a URL verificada.
