#!/bin/bash

# Roda o script: wsl bash ./start.sh

# Cores ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Arquivo de compose e arquivo de log temporario
COMPOSE_FILE="docker-compose.yml"
LOG_FILE="/tmp/masterbank_cmd.log"

# lista de servicos Java que precisam de JAR compilado
JAVA_SERVICES=(
    "services/auth-service"
    "services/cliente-service"
    "services/conta-service"
    "services/gerente-service"
    "services/saga-service"
)

# banner | exibe o cabecalho do projeto
banner() {
    clear
    echo -e "${BOLD}${BLUE}"
    echo "  +-------------------------------------------+"
    echo "  |           MasterBank  DevOps              |"
    echo "  |   Build . Deploy . Gestao de Containers   |"
    echo "  +-------------------------------------------+"
    echo -e "${RESET}"
}

# spinner | exibe animacao de carregamento enquanto um processo esta em execucao
spinner() {
    local pid=$1
    local msg="$2"
    local frames='|/-\'
    local i=0
    while kill -0 "$pid" 2>/dev/null; do
        local frame="${frames:$i:1}"
        printf "\r  ${CYAN}%s${RESET}  %s" "$frame" "$msg"
        i=$(( (i + 1) % 4 ))
        sleep 0.1
    done
}

# run_step | executa um comando exibindo spinner e valida o resultado
run_step() {
    local msg="$1"
    shift
    printf "\r  ${CYAN}|${RESET}  %s" "$msg"
    "$@" > "$LOG_FILE" 2>&1 &
    local pid=$!
    spinner "$pid" "$msg"
    wait "$pid"
    local code=$?
    if [ $code -ne 0 ]; then
        printf "\r  ${RED}x${RESET}  %s\n" "$msg"
        echo -e "\n${RED}${BOLD}Erro ao executar: ${RESET}${DIM}$*${RESET}\n"
        echo -e "${RED}---- Output ----------------------------------${RESET}"
        cat "$LOG_FILE"
        echo -e "${RED}---------------------------------------------${RESET}\n"
        return 1
    fi
    printf "\r  ${GREEN}v${RESET}  %s\n" "$msg"
    return 0
}

# mvn_bin | resolve o executavel mvn: PATH -> MAVEN_HOME -> vazio (usara Docker)
mvn_bin() {
    local java_ok=false
    if command -v java &>/dev/null; then
        java_ok=true
    elif [ -n "$JAVA_HOME" ] && [ -f "$JAVA_HOME/bin/java" ]; then
        java_ok=true
    fi

    if $java_ok && command -v mvn &>/dev/null; then
        echo "mvn"
    elif $java_ok && [ -n "$MAVEN_HOME" ] && [ -f "$MAVEN_HOME/bin/mvn" ]; then
        echo "$MAVEN_HOME/bin/mvn"
    else
        echo ""
    fi
}

# fix_docker_creds | remove credsStore quebrado do docker config (credencial Windows inacessivel no WSL)
fix_docker_creds() {
    local config="$HOME/.docker/config.json"
    [ -f "$config" ] || return 0
    grep -q '"credsStore"' "$config" 2>/dev/null || return 0
    if command -v python3 &>/dev/null; then
        python3 - "$config" <<'EOF'
import sys, json
p = sys.argv[1]
with open(p) as f: d = json.load(f)
d.pop('credsStore', None)
with open(p, 'w') as f: json.dump(d, f, indent=2)
EOF
    else
        sed -i '/"credsStore"/d' "$config" 2>/dev/null || true
    fi
}

# ensure_maven_image | baixa a imagem maven se nao existir localmente
ensure_maven_image() {
    local image="maven:3.9-eclipse-temurin-17"
    if docker image inspect "$image" &>/dev/null; then
        return 0
    fi
    echo -e "\n${YELLOW}Imagem $image nao encontrada. Baixando (pode demorar na primeira vez)...${RESET}"
    docker pull "$image"
}

# strip_bom | remove BOM (UTF-8) de todos os arquivos .java de um servico
strip_bom() {
    local path="$1"
    find "$path/src" -name "*.java" -exec sed -i 's/^\xef\xbb\xbf//' {} +
}

# compile_service | compila um unico servico Java via Maven (local ou via container Maven)
compile_service() {
    local path="$1"
    local name
    name=$(basename "$path")
    local mvn
    mvn=$(mvn_bin)

    strip_bom "$path"

    if [ -n "$mvn" ]; then
        run_step "Compilando $name (mvn local)" \
            "$mvn" -f "$path/pom.xml" package -DskipTests -q || return 1
    else
        # maven:3.9-eclipse-temurin-17 ja tem mvn + JDK sem precisar instalar nada
        # volume masterbank-maven-cache reutiliza dependencias entre compilacoes
        ensure_maven_image || return 1
        run_step "Compilando $name (mvn via Docker)" \
            docker run --rm \
                -e JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8" \
                -v "$(pwd)/$path:/workspace" \
                -v "masterbank-maven-cache:/root/.m2" \
                -w /workspace \
                maven:3.9-eclipse-temurin-17 \
                mvn package -DskipTests -q -Dmaven.compile.encoding=UTF-8 \
            || return 1
    fi
}

# compile_missing | compila apenas os servicos que nao possuem JAR gerado
compile_missing() {
    local compilou=0
    echo -e "\n${YELLOW}Verificando JARs dos servicos Java...${RESET}"
    for svc in "${JAVA_SERVICES[@]}"; do
        local jar_count
        jar_count=$(find "$svc/target" -maxdepth 1 -name "*.jar" ! -name "*.jar.original" 2>/dev/null | wc -l)
        if [ "$jar_count" -eq 0 ]; then
            echo -e "  ${YELLOW}!${RESET}  $(basename "$svc") - JAR ausente, compilando..."
            compile_service "$svc" || return 1
            compilou=1
        else
            echo -e "  ${GREEN}v${RESET}  $(basename "$svc") - JAR encontrado"
        fi
    done
    [ $compilou -eq 0 ] && echo -e "  ${DIM}Todos os JARs ja estao presentes.${RESET}"
    echo ""
}

# compile_all | forca a recompilacao de todos os servicos Java
compile_all() {
    echo -e "\n${YELLOW}Recompilando todos os servicos Java...${RESET}"
    for svc in "${JAVA_SERVICES[@]}"; do
        compile_service "$svc" || return 1
    done
    echo ""
}

# compile_specific | exibe lista dos servicos Java e compila o escolhido
compile_specific() {
    echo -e "\n${CYAN}${BOLD}Servicos Java disponiveis:${RESET}\n"
    local i=1
    for svc in "${JAVA_SERVICES[@]}"; do
        local name
        name=$(basename "$svc")
        local jar_count
        jar_count=$(find "$svc/target" -maxdepth 1 -name "*.jar" ! -name "*.jar.original" 2>/dev/null | wc -l)
        if [ "$jar_count" -gt 0 ]; then
            echo -e "  ${GREEN}[$i]${RESET}  $name  ${DIM}(JAR presente)${RESET}"
        else
            echo -e "  ${YELLOW}[$i]${RESET}  $name  ${DIM}(JAR ausente)${RESET}"
        fi
        i=$((i + 1))
    done
    echo -e "  ${DIM}[0]  Voltar${RESET}\n"
    echo -ne "  ${CYAN}Escolha o servico: ${RESET}"
    local escolha
    read -r escolha

    [ "$escolha" = "0" ] && return

    if ! [[  "$escolha" =~ ^[0-9]+$ ]] || [ "$escolha" -lt 1 ] || [ "$escolha" -gt "${#JAVA_SERVICES[@]}" ]; then
        echo -e "  ${RED}Opcao invalida.${RESET}\n"
        return 1
    fi

    local svc_path="${JAVA_SERVICES[$((escolha - 1))]}"
    compile_service "$svc_path" || return 1
    echo ""
}

# menu_compilacao | menu inicial de decisao sobre compilacao Maven
menu_compilacao() {
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -e "${BOLD}${BLUE}  |        Preparacao dos servicos Java       |${RESET}"
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${GREEN}[1]${RESET}  Compila apenas os faltantes        ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${YELLOW}[2]${RESET}  Recompila TODOS os servicos        ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${CYAN}[3]${RESET}  Escolher servico especifico        ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${DIM}[4]  Pula compilacao (JARs ja prontos)  ${RESET}${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -ne "  ${CYAN}Escolha uma opcao: ${RESET}"
    local escolha
    read -r escolha
    case "$escolha" in
        1) compile_missing  || return 1 ;;
        2) compile_all      || return 1 ;;
        3) compile_specific || return 1 ;;
        4) echo -e "  ${DIM}Compilacao ignorada.${RESET}\n" ;;
        *)
            echo -e "  ${RED}Opcao invalida, compilando apenas os faltantes por padrao.${RESET}\n"
            compile_missing || return 1
            ;;
    esac
}

# teardown | para e remove os containers sem apagar volumes
teardown() {
    echo -e "\n${YELLOW}Derrubando containers...${RESET}"
    run_step "Parando e removendo containers" \
        docker compose -f "$COMPOSE_FILE" down
}

# teardown_volumes | para containers e apaga todos os volumes persistentes
teardown_volumes() {
    echo -e "\n${YELLOW}Derrubando containers e removendo volumes...${RESET}"
    run_step "Removendo containers e volumes" \
        docker compose -f "$COMPOSE_FILE" down -v
}

# build_images | constroi todas as imagens Docker sem cache
build_images() {
    echo -e "\n${YELLOW}Construindo imagens Docker...${RESET}"
    run_step "Build das imagens (sem cache)" \
        docker compose -f "$COMPOSE_FILE" build --no-cache || return 1
}

# build_images_cached | constroi imagens aproveitando cache existente
build_images_cached() {
    echo -e "\n${YELLOW}Construindo imagens Docker...${RESET}"
    run_step "Build das imagens (com cache)" \
        docker compose -f "$COMPOSE_FILE" build || return 1
}

# start_services | sobe todos os servicos em modo detached
start_services() {
    echo -e "\n${YELLOW}Subindo servicos...${RESET}"
    run_step "Criando rede dac-network (se necessario)" \
        docker network inspect dac-network > /dev/null 2>&1 \
        || docker network create dac-network > /dev/null 2>&1 \
        || true
    run_step "Iniciando todos os servicos" \
        docker compose -f "$COMPOSE_FILE" up -d || return 1
    echo -e "\n${GREEN}${BOLD}Ambiente rodando!${RESET}"
    echo -e "  ${DIM}Frontend   ->${RESET}  ${CYAN}http://localhost:8080${RESET}"
    echo -e "  ${DIM}Gateway    ->${RESET}  ${CYAN}http://localhost:3000${RESET}"
    echo -e "  ${DIM}RabbitMQ   ->${RESET}  ${CYAN}http://localhost:15672${RESET}"
    echo -e "  ${DIM}Postgres   ->${RESET}  ${CYAN}localhost:5432${RESET}"
    echo -e "  ${DIM}MongoDB    ->${RESET}  ${CYAN}localhost:27017${RESET}\n"
}

# full_start | inicializacao normal: compila faltantes, build com cache, sobe
full_start() {
    compile_missing || return 1
    build_images_cached || return 1
    start_services || return 1
}

# rebuild | fluxo completo de recriacao: down -> compilacao -> build -> up
rebuild() {
    echo -e "\n${YELLOW}${BOLD}Iniciando rebuild completo...${RESET}"
    teardown     || return 1
    menu_compilacao || return 1
    build_images || return 1
    start_services || return 1
    echo -e "${GREEN}Rebuild concluido.${RESET}\n"
}

# list_services | retorna a lista de servicos definidos no compose
list_services() {
    docker compose -f "$COMPOSE_FILE" config --services 2>/dev/null
}

# manage_service | permite subir ou derrubar um servico especifico
manage_service() {
    echo -e "\n${CYAN}${BOLD}Servicos disponiveis:${RESET}\n"
    local services=()
    while IFS= read -r svc; do
        services+=("$svc")
    done < <(list_services)

    local i=1
    for svc in "${services[@]}"; do
        local running
        running=$(docker compose -f "$COMPOSE_FILE" ps --status running -q "$svc" 2>/dev/null)
        if [ -n "$running" ]; then
            echo -e "  ${GREEN}[$i]${RESET}  $svc  ${DIM}(rodando)${RESET}"
        else
            echo -e "  ${RED}[$i]${RESET}  $svc  ${DIM}(parado)${RESET}"
        fi
        i=$((i + 1))
    done
    echo -e "  ${DIM}[0]  Voltar${RESET}\n"
    echo -ne "  ${CYAN}Escolha o servico: ${RESET}"
    local escolha
    read -r escolha

    [ "$escolha" = "0" ] && return

    if ! [[ "$escolha" =~ ^[0-9]+$ ]] || [ "$escolha" -lt 1 ] || [ "$escolha" -gt "${#services[@]}" ]; then
        echo -e "  ${RED}Opcao invalida.${RESET}\n"
        return
    fi

    local svc_name="${services[$((escolha - 1))]}"
    echo -e "\n  Servico: ${BOLD}$svc_name${RESET}"
    echo -e "  ${GREEN}[1]${RESET}  Subir"
    echo -e "  ${RED}[2]${RESET}  Derrubar"
    echo -e "  ${DIM}[0]  Voltar${RESET}\n"
    echo -ne "  ${CYAN}Acao: ${RESET}"
    local acao
    read -r acao
    case "$acao" in
        1) run_step "Subindo $svc_name" \
               docker compose -f "$COMPOSE_FILE" up -d "$svc_name" ;;
        2) run_step "Derrubando $svc_name" \
               docker compose -f "$COMPOSE_FILE" stop "$svc_name" ;;
        0) return ;;
        *) echo -e "  ${RED}Opcao invalida.${RESET}\n" ;;
    esac
    echo ""
}

# menu_boot | menu de escolha do modo de inicializacao
menu_boot() {
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -e "${BOLD}${BLUE}  |         Modo de Inicializacao             |${RESET}"
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${GREEN}[1]${RESET}  Subir normalmente (com cache)      ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${YELLOW}[2]${RESET}  Rebuild completo (sem cache)       ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${RED}[3]${RESET}  Sair                               ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -ne "  ${CYAN}Escolha uma opcao: ${RESET}"
    local escolha
    read -r escolha
    case "$escolha" in
        1) full_start || return 1 ;;
        2)
            menu_compilacao || return 1
            build_images || return 1
            start_services || return 1
            ;;
        3) echo -e "\n${DIM}Saindo.${RESET}\n"; exit 0 ;;
        *)
            echo -e "  ${RED}Opcao invalida, subindo normalmente.${RESET}\n"
            full_start || return 1
            ;;
    esac
}

# show_logs | exibe os logs em tempo real de todos os servicos
show_logs() {
    echo -e "\n${CYAN}Exibindo logs em tempo real - Ctrl+C para voltar ao menu${RESET}\n"
    docker compose -f "$COMPOSE_FILE" logs -f
}

# show_status | exibe o status atual dos containers
show_status() {
    echo -e "\n${CYAN}${BOLD}Status dos containers:${RESET}\n"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
}

# menu | exibe as opcoes disponiveis
menu() {
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -e "${BOLD}${BLUE}  |             Menu Principal                |${RESET}"
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${GREEN}[1]${RESET}  Ver logs em tempo real         ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${GREEN}[2]${RESET}  Status dos containers          ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${CYAN}[3]${RESET}  Gerenciar servico individual   ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${YELLOW}[4]${RESET}  Rebuild completo               ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${YELLOW}[5]${RESET}  Recompilar servicos Java       ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${RED}[6]${RESET}  Apagar volumes                 ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  |${RESET}  ${RED}[7]${RESET}  Sair e derrubar tudo           ${BOLD}${BLUE}|${RESET}"
    echo -e "${BOLD}${BLUE}  +-------------------------------------------+${RESET}"
    echo -ne "  ${CYAN}Escolha uma opcao: ${RESET}"
}

# cleanup | derruba tudo ao encerrar o script (Ctrl+C ou opcao 7)
cleanup() {
    echo -e "\n\n${YELLOW}Encerrando ambiente...${RESET}"
    teardown
    echo -e "${GREEN}Ambiente encerrado com sucesso.${RESET}\n"
    exit 0
}

# captura Ctrl+C e SIGTERM para derrubar tudo ao sair
trap cleanup SIGINT SIGTERM

# corrige credential helper do Docker antes de qualquer operacao
fix_docker_creds

# exibe banner e apresenta menu de boot
banner
menu_boot || {
    echo -e "\n${RED}${BOLD}Falha no boot. Corrija os erros acima e tente novamente.${RESET}\n"
    exit 1
}

# loop do menu enquanto o script estiver ativo
while true; do
    menu
    read -r opcao
    case "$opcao" in
        1) show_logs ;;
        2) show_status ;;
        3) manage_service ;;
        4)
            echo -ne "\n  ${YELLOW}Isso vai derrubar tudo e recriar as imagens. Confirma? ${DIM}(s/N)${RESET}: "
            read -r confirmacao
            if [[ "$confirmacao" =~ ^[sS]$ ]]; then
                rebuild
            else
                echo -e "  ${DIM}Operacao cancelada.${RESET}\n"
            fi
            ;;
        5)
            menu_compilacao
            ;;
        6)
            echo -ne "\n  ${RED}${BOLD}Isso vai apagar TODOS os dados persistentes (banco, fila, etc). Confirma? ${DIM}(s/N)${RESET}: "
            read -r confirmacao
            if [[ "$confirmacao" =~ ^[sS]$ ]]; then
                teardown_volumes
                echo -e "  ${GREEN}Volumes removidos.${RESET}"
                echo -ne "  Deseja subir o ambiente novamente agora? ${DIM}(s/N)${RESET}: "
                read -r reiniciar
                if [[ "$reiniciar" =~ ^[sS]$ ]]; then
                    build_images && start_services
                fi
            else
                echo -e "  ${DIM}Operacao cancelada.${RESET}\n"
            fi
            ;;
        7) cleanup ;;
        *)
            echo -e "\n  ${RED}Opcao invalida. Escolha entre 1 e 7.${RESET}\n"
            ;;
    esac
done