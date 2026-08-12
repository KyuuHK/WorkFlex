import { Controller, Get, Param, Query } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { QuerySpacesDto } from './dto/query-spaces.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

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

  @Get(':id/availability')
  getAvailability(
    @Param('id') id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.spacesService.getAvailability(id, query.date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }
}
