import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto, AddFavoriteSchema, FavoriteRecordDto } from './favorites.dto';

const OkResponse = { schema: { properties: { ok: { type: 'boolean', example: true } } } };

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '获取全部收藏（按保存时间倒序）' })
  @ApiOkResponse({ type: [FavoriteRecordDto] })
  getAll() {
    return this.favoritesService.getAll();
  }

  @Post()
  @ApiOperation({ summary: '添加收藏' })
  @ApiBody({ type: AddFavoriteDto })
  @ApiCreatedResponse(OkResponse)
  @ApiBadRequestResponse({ description: '请求体校验失败' })
  add(@Body() body: unknown) {
    const result = AddFavoriteSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    this.favoritesService.add(result.data);
    return { ok: true };
  }

  @Delete()
  @ApiOperation({ summary: '清空所有收藏' })
  @ApiOkResponse(OkResponse)
  clearAll() {
    this.favoritesService.clearAll();
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除单条收藏' })
  @ApiParam({ name: 'id', description: '收藏记录 ID' })
  @ApiOkResponse(OkResponse)
  remove(@Param('id') id: number) {
    this.favoritesService.remove(id);
    return { ok: true };
  }
}