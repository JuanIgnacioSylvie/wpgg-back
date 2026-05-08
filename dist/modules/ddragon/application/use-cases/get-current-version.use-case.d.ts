import { IDdragonService } from '../../domain/services/ddragon.service.interface';
export declare class GetCurrentVersionUseCase {
    private readonly ddragonService;
    constructor(ddragonService: IDdragonService);
    execute(): Promise<string>;
}
