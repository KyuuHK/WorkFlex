import { Controller, Get, Param, Query } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { QuerySpacesDto } from './dto/query-spaces.dto';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  findAll(@Query() query: QuerySpacesDto) {
    return this.spacesService.findAll(query);
  }

  @Get('cities')
  findCities() {
    return this.spacesService.findCities();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }
}
