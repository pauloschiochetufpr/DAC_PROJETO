#!/bin/bash

# Roda script: wsl bash ./start.sh

# Cores ANSI
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Arquivo de compose e arquivo de log temporário
COMPOSE_FILE="docker-compose.yml"
LOG_FILE="/tmp/masterbank_cmd.log"

# lista de serviços Java que precisam de JAR compilado
JAVA_SERVICES=(
    "services/auth-service"
    "services/cliente-service"
    "services/conta-service"
    "services/gerente-service"
    "services/saga-service"
)

# banner | exibe o cabeçalho do projeto
banner() {

    clear
    echo -e "${BOLD}${BLUE}"
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║           MasterBank  DevOps             ║"
    echo "  ║   Build · Deploy · Gestão de Containers  ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${RESET}"
}

# spinner | exibe animação de carregamento enquanto um processo está em execução
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
        printf "\r  ${RED}✗${RESET}  %s\n" "$msg"
        echo -e "\n${RED}${BOLD}Erro ao executar: ${RESET}${DIM}$*${RESET}\n"
        echo -e "${RED}──── Output ────────────────────────────────${RESET}"
        cat "$LOG_FILE"
        echo -e "${RED}────────────────────────────────────────────${RESET}\n"
        return 1
    fi
    printf "\r  ${GREEN}✓${RESET}  %s\n" "$msg"
    return 0
}

# mvn_bin | resolve o executável mvn: PATH -> MAVEN_HOME -> vazio (usará Docker)
mvn_bin() {
    # java precisa estar acessível para o mvn funcionar
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

# strip_bom | remove BOM (UTF-8) de todos os arquivos .java de um serviço
strip_bom() {
    local path="$1"
    find "$path/src" -name "*.java" -exec sed -i 's/^\xef\xbb\xbf//' {} +
}

# compile_service | compila um único serviço Java via Maven (local ou via container Maven)
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
        # maven:3.9-eclipse-temurin-17 já tem mvn + JDK sem precisar instalar nada
        # volume masterbank-maven-cache reutiliza dependências entre compilações
        run_step "Compilando $name (mvn via Docker)" \
            docker run --rm \
                -e JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8" \
                -v "$(pwd)/$path:/workspace" \
                -v "masterbank-maven-cache:/root/.m2" \
                -w /workspace \
                maven:3.9-eclipse-temurin-17 \
                mvn package -DskipTests -q -Dmaven.compiler.encoding=UTF-8 \
            || return 1
    fi
}

# compile_missing | compila apenas os serviços que não possuem JAR gerado
compile_missing() {
    local compilou=0
    echo -e "\n${YELLOW}Verificando JARs dos serviços Java...${RESET}"
    for svc in "${JAVA_SERVICES[@]}"; do
        local jar_count
        jar_count=$(find "$svc/target" -maxdepth 1 -name "*.jar" ! -name "*.jar.original" 2>/dev/null | wc -l)
        if [ "$jar_count" -eq 0 ]; then
            echo -e "  ${YELLOW}!${RESET}  $(basename "$svc") — JAR ausente, compilando..."
            compile_service "$svc" || return 1
            compilou=1
        else
            echo -e "  ${GREEN}✓${RESET}  $(basename "$svc") — JAR encontrado"
        fi
    done
    [ $compilou -eq 0 ] && echo -e "  ${DIM}Todos os JARs já estão presentes.${RESET}"
    echo ""
}

# compile_all | força a recompilação de todos os serviços Java
compile_all() {
    echo -e "\n${YELLOW}Recompilando todos os serviços Java...${RESET}"
    for svc in "${JAVA_SERVICES[@]}"; do
        compile_service "$svc" || return 1
    done
    echo ""
}

# menu_compilacao | menu inicial de decisão sobre compilação Maven
menu_compilacao() {
    echo -e "${BOLD}${BLUE}  ╔══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${BLUE}  ║        Preparação dos serviços Java      ║${RESET}"
    echo -e "${BOLD}${BLUE}  ╠══════════════════════════════════════════╣${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${GREEN}[1]${RESET}  Compilar apenas os faltantes        ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${YELLOW}[2]${RESET}  Recompilar TODOS os serviços         ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${DIM}[3]  Pular compilação (JARs já prontos)  ${RESET}${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ╚══════════════════════════════════════════╝${RESET}"
    echo -ne "  ${CYAN}Escolha uma opção: ${RESET}"
    local escolha
    read -r escolha
    case "$escolha" in
        1) compile_missing || return 1 ;;
        2) compile_all     || return 1 ;;
        3) echo -e "  ${DIM}Compilação ignorada.${RESET}\n" ;;
        *)
            echo -e "  ${RED}Opção inválida, compilando apenas os faltantes por padrão.${RESET}\n"
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

# build_images | constrói todas as imagens Docker sem cache
build_images() {
    echo -e "\n${YELLOW}Construindo imagens Docker...${RESET}"
    run_step "Build das imagens (sem cache)" \
        docker compose -f "$COMPOSE_FILE" build --no-cache || return 1
}

# build_images_cached | constrói imagens aproveitando cache existente
build_images_cached() {
    echo -e "\n${YELLOW}Construindo imagens Docker...${RESET}"
    run_step "Build das imagens (com cache)" \
        docker compose -f "$COMPOSE_FILE" build || return 1
}

# start_services | sobe todos os serviços em modo detached
start_services() {
    echo -e "\n${YELLOW}Subindo serviços...${RESET}"
    run_step "Criando rede dac-network (se necessário)" \
        docker network inspect dac-network > /dev/null 2>&1 \
        || docker network create dac-network > /dev/null 2>&1 \
        || true
    run_step "Iniciando todos os serviços" \
        docker compose -f "$COMPOSE_FILE" up -d || return 1
    echo -e "\n${GREEN}${BOLD}Ambiente rodando!${RESET}"
    echo -e "  ${DIM}Frontend   ->${RESET}  ${CYAN}http://localhost:8080${RESET}"
    echo -e "  ${DIM}Gateway    ->${RESET}  ${CYAN}http://localhost:3000${RESET}"
    echo -e "  ${DIM}RabbitMQ   ->${RESET}  ${CYAN}http://localhost:15672${RESET}"
    echo -e "  ${DIM}Postgres   ->${RESET}  ${CYAN}localhost:5432${RESET}"
    echo -e "  ${DIM}MongoDB    ->${RESET}  ${CYAN}localhost:27017${RESET}\n"
}

# full_start | inicialização normal: compila faltantes, build com cache, sobe
full_start() {
    compile_missing || return 1
    build_images_cached || return 1
    start_services || return 1
}

# rebuild | fluxo completo de recriação: down -> compilação -> build -> up
rebuild() {
    echo -e "\n${YELLOW}${BOLD}Iniciando rebuild completo...${RESET}"
    teardown     || return 1
    menu_compilacao || return 1
    build_images || return 1
    start_services || return 1
    echo -e "${GREEN}Rebuild concluído.${RESET}\n"
}

# list_services | retorna a lista de serviços definidos no compose
list_services() {
    docker compose -f "$COMPOSE_FILE" config --services 2>/dev/null
}

# manage_service | permite subir ou derrubar um serviço específico
manage_service() {
    echo -e "\n${CYAN}${BOLD}Serviços disponíveis:${RESET}\n"
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
    echo -ne "  ${CYAN}Escolha o serviço: ${RESET}"
    local escolha
    read -r escolha

    [ "$escolha" = "0" ] && return

    if ! [[  "$escolha" =~ ^[0-9]+$ ]] || [ "$escolha" -lt 1 ] || [ "$escolha" -gt "${#services[@]}" ]; then
        echo -e "  ${RED}Opção inválida.${RESET}\n"
        return
    fi

    local svc_name="${services[$((escolha - 1))]}"
    echo -e "\n  Serviço: ${BOLD}$svc_name${RESET}"
    echo -e "  ${GREEN}[1]${RESET}  Subir"
    echo -e "  ${RED}[2]${RESET}  Derrubar"
    echo -e "  ${DIM}[0]  Voltar${RESET}\n"
    echo -ne "  ${CYAN}Ação: ${RESET}"
    local acao
    read -r acao
    case "$acao" in
        1) run_step "Subindo $svc_name" \
               docker compose -f "$COMPOSE_FILE" up -d "$svc_name" ;;
        2) run_step "Derrubando $svc_name" \
               docker compose -f "$COMPOSE_FILE" stop "$svc_name" ;;
        0) return ;;
        *) echo -e "  ${RED}Opção inválida.${RESET}\n" ;;
    esac
    echo ""
}

# menu_boot | menu de escolha do modo de inicialização
menu_boot() {
    echo -e "${BOLD}${BLUE}  ╔══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${BLUE}  ║         Modo de Inicialização            ║${RESET}"
    echo -e "${BOLD}${BLUE}  ╠══════════════════════════════════════════╣${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${GREEN}[1]${RESET}  Subir normalmente (com cache)       ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${YELLOW}[2]${RESET}  Rebuild completo (sem cache)        ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${RED}[3]${RESET}  Sair                                ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ╚══════════════════════════════════════════╝${RESET}"
    echo -ne "  ${CYAN}Escolha uma opção: ${RESET}"
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
            echo -e "  ${RED}Opção inválida, subindo normalmente.${RESET}\n"
            full_start || return 1
            ;;
    esac
}

# show_logs | exibe os logs em tempo real de todos os serviços
show_logs() {
    echo -e "\n${CYAN}Exibindo logs em tempo real — ${DIM}Ctrl+C para voltar ao menu${RESET}\n"
    docker compose -f "$COMPOSE_FILE" logs -f
}

# show_status | exibe o status atual dos containers
show_status() {
    echo -e "\n${CYAN}${BOLD}Status dos containers:${RESET}\n"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
}

# menu | exibe as opções disponíveis
menu() {
    echo -e "${BOLD}${BLUE}  ╔══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${BLUE}  ║             Menu Principal               ║${RESET}"
    echo -e "${BOLD}${BLUE}  ╠══════════════════════════════════════════╣${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${GREEN}[1]${RESET}  Ver logs em tempo real          ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${GREEN}[2]${RESET}  Status dos containers           ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${CYAN}[3]${RESET}  Gerenciar serviço individual    ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${YELLOW}[4]${RESET}  Rebuild completo                ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${YELLOW}[5]${RESET}  Recompilar serviços Java        ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${RED}[6]${RESET}  Apagar volumes                  ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ║${RESET}  ${RED}[7]${RESET}  Sair e derrubar tudo            ${BOLD}${BLUE}║${RESET}"
    echo -e "${BOLD}${BLUE}  ╚══════════════════════════════════════════╝${RESET}"
    echo -ne "  ${CYAN}Escolha uma opção: ${RESET}"
}

# cleanup | derruba tudo ao encerrar o script (Ctrl+C ou opção 5)
cleanup() {
    echo -e "\n\n${YELLOW}Encerrando ambiente...${RESET}"
    teardown
    echo -e "${GREEN}Ambiente encerrado com sucesso.${RESET}\n"
    exit 0
}

# captura Ctrl+C e SIGTERM para derrubar tudo ao sair
trap cleanup SIGINT SIGTERM

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
                echo -e "  ${DIM}Operação cancelada.${RESET}\n"
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
                echo -e "  ${DIM}Operação cancelada.${RESET}\n"
            fi
            ;;
        7) cleanup ;;
        *)
            echo -e "\n  ${RED}Opção inválida. Escolha entre 1 e 7.${RESET}\n"
            ;;
    esac
done
