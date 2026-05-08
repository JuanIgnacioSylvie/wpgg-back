$p = ".kiro/specs/riot-api-clean-architecture/design.md"
$doc = @"
# Design Document: riot-api-clean-architecture

## Overview

Esta API REST construida con NestJS + TypeScript implementa Clean Architecture de forma estricta para exponer datos de la plataforma de League of Legends (Riot Games). La arquitectura garantiza que el dominio sea completamente independiente de frameworks, ORMs y servicios externos, permitiendo que la logica de negocio sea testeable, mantenible y portable.

El sistema se divide en tres modulos principales: **auth** (autenticacion JWT con refresh tokens en cookies HttpOnly), **riot** (vinculacion de cuentas Riot y consulta de datos de juego), y **ddragon** (datos estaticos del juego como campeones y versiones de parche). Cada modulo sigue la misma estructura de capas: Domain, Application, Infrastructure, Presentation.

La regla de dependencias es el principio rector: Presentation -> Application -> Domain <- Infrastructure. El dominio no importa nada externo; la infraestructura implementa las interfaces del dominio; la presentacion solo llama casos de uso.

"@
Set-Content -Path $p -Value $doc -Encoding UTF8
Write-Host "Written overview"
